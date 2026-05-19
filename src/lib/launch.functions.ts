import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdmin } from "@/lib/auth/require-admin";

const emailSchema = z.string().trim().toLowerCase().email().max(255);

function makeCode(seed?: string) {
  const base = (seed ?? Math.random().toString(36)).replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `SLO-${base.slice(0, 6) || Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Public: read launch config (countdown, demo mode, waitlist open). */
export const getLaunchConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("launch_config")
    .select("launch_at, demo_mode_enabled, waitlist_open, referral_reward")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? {
    launch_at: null,
    demo_mode_enabled: false,
    waitlist_open: true,
    referral_reward: "1 month free Pro",
  };
});

/** Public: waitlist signup. Idempotent on email. Issues a referral code. */
export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: emailSchema,
        name: z.string().trim().min(1).max(120).optional(),
        role: z.enum(["student", "parent", "teacher", "school"]).default("student"),
        grade: z.string().trim().max(20).optional(),
        city: z.string().trim().max(80).optional(),
        source: z.string().trim().max(60).optional(),
        referredByCode: z.string().trim().max(40).optional(),
        utm: z.record(z.string(), z.string().max(120)).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const referralCode = makeCode(data.email);

    const { data: row, error } = await supabaseAdmin
      .from("waitlist_signups")
      .upsert(
        {
          email: data.email,
          name: data.name,
          role: data.role,
          grade: data.grade,
          city: data.city,
          source: data.source ?? "landing",
          referral_code: referralCode,
          referred_by_code: data.referredByCode?.toUpperCase() ?? null,
          utm: data.utm ?? {},
        },
        { onConflict: "email", ignoreDuplicates: false },
      )
      .select("id, email, referral_code, status")
      .single();
    if (error) throw new Error(error.message);

    // Bump referrer signups if applicable
    if (data.referredByCode) {
      const code = data.referredByCode.toUpperCase();
      const { data: ref } = await supabaseAdmin
        .from("referral_codes")
        .select("id, signups")
        .eq("code", code)
        .maybeSingle();
      if (ref) {
        await supabaseAdmin
          .from("referral_codes")
          .update({ signups: (ref.signups ?? 0) + 1 })
          .eq("id", ref.id);
      }
    }

    // Count for social proof
    const { count } = await supabaseAdmin
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true });

    return { ok: true, signup: row, totalSignups: count ?? 0 };
  });

/** Public: track referral click. */
export const trackReferralClick = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ code: z.string().trim().min(3).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const code = data.code.toUpperCase();
    const { data: existing } = await supabaseAdmin
      .from("referral_codes")
      .select("id, clicks")
      .eq("code", code)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin
        .from("referral_codes")
        .update({ clicks: (existing.clicks ?? 0) + 1 })
        .eq("id", existing.id);
    }
    return { ok: true };
  });

/** Public: schedule a demo. */
export const scheduleDemo = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        email: emailSchema,
        phone: z.string().trim().max(40).optional(),
        role: z.enum(["student", "parent", "teacher", "school"]).default("parent"),
        grade: z.string().trim().max(20).optional(),
        school: z.string().trim().max(160).optional(),
        preferredDate: z.string().trim().max(20).optional(),
        preferredTime: z.string().trim().max(20).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("demo_requests")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        grade: data.grade,
        school: data.school,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime,
        notes: data.notes,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, demo: row };
  });

/** Auth: create / fetch the signed-in user's referral code. */
export const getOrCreateMyReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("referral_codes")
      .select("code, clicks, signups")
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (existing) return existing;

    const code = makeCode(userId);
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ code, owner_user_id: userId })
      .select("code, clicks, signups")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

/** Admin: list waitlist signups. */
export const adminListWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z.enum(["pending", "invited", "onboarded", "rejected"]).optional(),
        limit: z.number().int().min(1).max(500).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("waitlist_signups")
      .select("id, email, name, role, grade, city, status, referral_code, referred_by_code, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("email", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Admin: list demo requests. */
export const adminListDemoRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: checklist list + update. */
export const adminListChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("launch_checklist")
      .select("*")
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["todo", "in_progress", "done", "blocked"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("launch_checklist")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: launch config update. */
export const adminUpdateLaunchConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        launchAt: z.string().datetime().nullable().optional(),
        demoModeEnabled: z.boolean().optional(),
        waitlistOpen: z.boolean().optional(),
        referralReward: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const patch: {
      launch_at?: string | null;
      demo_mode_enabled?: boolean;
      waitlist_open?: boolean;
      referral_reward?: string;
    } = {};
    if (data.launchAt !== undefined) patch.launch_at = data.launchAt;
    if (data.demoModeEnabled !== undefined) patch.demo_mode_enabled = data.demoModeEnabled;
    if (data.waitlistOpen !== undefined) patch.waitlist_open = data.waitlistOpen;
    if (data.referralReward !== undefined) patch.referral_reward = data.referralReward;
    const { error } = await context.supabase.from("launch_config").update(patch).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
