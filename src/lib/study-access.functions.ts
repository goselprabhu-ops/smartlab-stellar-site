import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TRIAL_DAYS = 15;

export type StudyAccess = {
  hasAccess: boolean;
  onboarded: boolean;
  hasClass: boolean;
  nextStep: "subscribe" | "onboarding" | "study";
  trialEndsAt: string | null;
  plan: "monthly" | "yearly" | null;
  status: "none" | "trialing" | "active" | "expired" | "canceled";
};

export const getStudyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudyAccess> => {
    const { supabase, userId } = context;
    const [{ data: sub }, { data: prof }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan,status,trial_ends_at,current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("class_id, onboarding_completed_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const now = Date.now();
    const trialing =
      sub?.status === "trialing" &&
      !!sub.trial_ends_at &&
      new Date(sub.trial_ends_at).getTime() > now;
    const active =
      sub?.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end).getTime() > now);
    const hasAccess = trialing || active;
    const onboarded = !!prof?.onboarding_completed_at;
    const hasClass = !!prof?.class_id;

    const nextStep: StudyAccess["nextStep"] = !hasAccess
      ? "subscribe"
      : !onboarded
        ? "onboarding"
        : "study";

    return {
      hasAccess,
      onboarded,
      hasClass,
      nextStep,
      trialEndsAt: sub?.trial_ends_at ?? null,
      plan: (sub?.plan as StudyAccess["plan"]) ?? null,
      status: (sub?.status as StudyAccess["status"]) ?? "none",
    };
  });

export const startTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ plan: z.enum(["monthly", "yearly"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Load parent identifiers from profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("parent_email, parent_mobile")
      .eq("user_id", userId)
      .maybeSingle();

    const emailNorm = (prof?.parent_email ?? "").trim().toLowerCase();
    const mobileNorm = (prof?.parent_mobile ?? "").replace(/\D/g, "");

    if (!emailNorm || !mobileNorm) {
      throw new Error("Parent email and mobile are required before starting a trial.");
    }

    // Use admin client via RPC-safe check: query ledger for either match
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prior } = await supabaseAdmin
      .from("parent_trial_ledger")
      .select("id, trial_ends_at, first_user_id")
      .or(`parent_email_norm.eq.${emailNorm},parent_mobile_norm.eq.${mobileNorm}`)
      .maybeSingle();

    if (prior) {
      // If this same family already has a trial — siblings automatically share access.
      if (prior.first_user_id !== userId) {
        return { ok: true, trialEndsAt: prior.trial_ends_at, shared: true };
      }
      throw new Error(
        "A free trial has already been used for this parent email or mobile. Please choose a paid plan.",
      );
    }

    const now = new Date();
    const trialEnds = new Date(now.getTime() + TRIAL_DAYS * 86400 * 1000);

    const { error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: data.plan,
          status: "trialing",
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnds.toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (subErr) throw new Error(subErr.message);

    const { error: ledgerErr } = await supabaseAdmin
      .from("parent_trial_ledger")
      .insert({
        parent_email_norm: emailNorm,
        parent_mobile_norm: mobileNorm,
        first_user_id: userId,
        plan: data.plan,
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
      });
    if (ledgerErr) {
      // Unique violation = race; treat as already used
      throw new Error(
        "A free trial has already been used for this parent email or mobile.",
      );
    }

    return { ok: true, trialEndsAt: trialEnds.toISOString() };
  });

/** Subjects belonging to the student's locked class that have ≥1 published chapter. */
export const listOnboardingSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles")
      .select("class_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof?.class_id) return [];

    const { data: subjects, error } = await supabase
      .from("subjects")
      .select("id, name, slug, icon, tags, class_id")
      .eq("class_id", prof.class_id)
      .order("name");
    if (error) throw new Error(error.message);

    if (!subjects?.length) return [];
    const ids = subjects.map((s) => s.id);
    const { data: chs } = await supabase
      .from("chapters")
      .select("subject_id")
      .in("subject_id", ids)
      .eq("published", true);
    const readySet = new Set((chs ?? []).map((c) => c.subject_id));
    return subjects.filter((s) => readySet.has(s.id));
  });

export const markOnboardingComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
