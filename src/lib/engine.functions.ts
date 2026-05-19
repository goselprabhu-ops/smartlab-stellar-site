/**
 * Adaptive Learning Engine — orchestrator.
 *
 * Ties the loop together: given a micro-concept, decide which phase the
 * student should be in next based on their session state + latest signals.
 *
 * Phase contract:
 *   study      → render canonical content; CTA "I'm ready to recall"
 *   recollect  → free-recall textarea; submit → scoreRecollection
 *   evaluate   → adaptive quiz; submit → recordEvaluation
 *   analyse    → trigger analyseWeakness, then either mastered or remediate
 *   remediate  → render AI-generated material; CTA "Restudy"
 *   mastered   → confetti + nextMicroConcept link
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EnginePhase =
  | "study"
  | "recollect"
  | "evaluate"
  | "analyse"
  | "remediate"
  | "mastered";

export const getEngineState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: mc, error: mcErr } = await supabase
      .from("micro_concepts")
      .select("id, title, learning_objective, content_md, difficulty, estimated_minutes, bloom_level, tags, concept_id")
      .eq("id", data.microConceptId)
      .single();
    if (mcErr || !mc) throw new Error("Micro-concept not found");

    const { data: session } = await supabase
      .from("learning_sessions")
      .select("*")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    const { data: mastery } = await supabase
      .from("concept_mastery")
      .select("mastery, confidence, streak, decay_at, last_practiced_at")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    const [{ data: recalls }, { data: evals }, { data: material }, { data: weakness }] = await Promise.all([
      supabase
        .from("recollection_attempts")
        .select("id, ai_score, ai_feedback, created_at")
        .eq("student_id", userId)
        .in("session_id", session ? [session.id] : ["00000000-0000-0000-0000-000000000000"])
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("evaluation_attempts")
        .select("id, score, total, per_question, created_at")
        .eq("student_id", userId)
        .in("session_id", session ? [session.id] : ["00000000-0000-0000-0000-000000000000"])
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("ai_generated_material")
        .select("id, kind, payload, created_at")
        .eq("student_id", userId)
        .in("session_id", session ? [session.id] : ["00000000-0000-0000-0000-000000000000"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("weakness_profile")
        .select("weakness_tags, confidence, notes, updated_at")
        .eq("student_id", userId)
        .eq("micro_concept_id", data.microConceptId)
        .maybeSingle(),
    ]);

    // Derive phase.
    let phase: EnginePhase = "study";
    const state = session?.state as string | undefined;
    const lastRecall = (recalls ?? [])[0];
    const lastEval = (evals ?? [])[0];

    if (!session || state === "not_started" || state === "studying") {
      phase = lastRecall ? "evaluate" : "study";
      if (!lastRecall && state === "studying") phase = "recollect";
    } else if (state === "evaluating") {
      phase = lastEval ? "analyse" : "evaluate";
    } else if (state === "weak" || state === "remediating") {
      phase = "remediate";
    } else if (state === "mastered") {
      phase = "mastered";
    }

    return {
      microConcept: mc,
      session,
      mastery,
      phase,
      lastRecall: lastRecall ?? null,
      lastEval: lastEval ?? null,
      material: material ?? [],
      weakness: weakness ?? null,
    };
  });

/**
 * Restart the loop on demand (e.g. after remediation → "Restudy").
 */
export const restudy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("learning_sessions")
      .update({ state: "studying", last_event_at: new Date().toISOString() })
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId);
    return { ok: true };
  });
