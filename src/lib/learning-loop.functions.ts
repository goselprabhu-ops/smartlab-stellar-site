/**
 * Adaptive learning loop — server functions.
 *
 * Implements the Study → Recollect → Evaluate → Analyse Weakness →
 * AI Targeted Material → Restudy continuous loop at the micro-concept grain.
 *
 * Mastery rule: state becomes "mastered" when the last recollection score is
 * >= 0.7 AND the last evaluation score is >= 0.8. Otherwise the loop drops to
 * "weak", AI remediation runs, and the session re-enters "studying".
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJson, AI_MODEL_DEFAULT } from "./ai-gateway.server";

// ---------- shared helpers ----------

async function getOrCreateSession(
  supabase: any,
  userId: string,
  microConceptId: string,
) {
  const { data: existing } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("student_id", userId)
    .eq("micro_concept_id", microConceptId)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("learning_sessions")
    .insert({ student_id: userId, micro_concept_id: microConceptId, state: "studying" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getMicroConcept(supabase: any, id: string) {
  const { data, error } = await supabase
    .from("micro_concepts")
    .select("id, title, learning_objective, content_md, difficulty")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("Micro-concept not found");
  return data;
}

// =========================================================
// 1. Start / advance a session (Study phase)
// =========================================================
export const startLearningSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const session = await getOrCreateSession(supabase, userId, data.microConceptId);
    await supabase
      .from("learning_sessions")
      .update({ state: "studying", last_event_at: new Date().toISOString() })
      .eq("id", session.id);
    return { sessionId: session.id, state: "studying" as const };
  });

// =========================================================
// 2. Score a free-recall attempt (Recollect phase)
// =========================================================
const RecallSchema = z.object({
  score: z.number().min(0).max(1),
  coveredPoints: z.array(z.string()).default([]),
  missedPoints: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  feedback: z.string(),
});
type RecallResult = z.infer<typeof RecallSchema>;

export const scoreRecollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      microConceptId: z.string().uuid(),
      response: z.string().min(1).max(4000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const mc = await getMicroConcept(supabase, data.microConceptId);
    const session = await getOrCreateSession(supabase, userId, data.microConceptId);

    const prompt = `Recall everything you know about: ${mc.title}`;
    const result = await aiJson<RecallResult>([
      {
        role: "system",
        content:
          "You are an expert tutor scoring a student's free-recall answer. " +
          "Compare the student's response to the learning objective and the canonical content. " +
          'Return strict JSON: {"score":0..1,"coveredPoints":[],"missedPoints":[],"misconceptions":[],"feedback":""}. ' +
          "Score = fraction of key points correctly recalled. Be precise and brief.",
      },
      {
        role: "user",
        content: [
          `Micro-concept: ${mc.title}`,
          `Learning objective: ${mc.learning_objective ?? "(none)"}`,
          `Canonical content:\n${mc.content_md ?? "(not provided — judge against the objective)"}`,
          `Student response:\n${data.response}`,
        ].join("\n\n"),
      },
    ]);
    const parsed = RecallSchema.parse(result);

    const { data: attempt, error: aErr } = await supabase
      .from("recollection_attempts")
      .insert({
        session_id: session.id,
        student_id: userId,
        prompt,
        student_response: data.response,
        ai_score: parsed.score,
        ai_feedback: parsed,
      })
      .select("*")
      .single();
    if (aErr) throw new Error(aErr.message);

    await supabase
      .from("learning_sessions")
      .update({
        state: "evaluating",
        attempts: (session.attempts ?? 0) + 1,
        last_event_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return { attemptId: attempt.id, sessionId: session.id, result: parsed };
  });

// =========================================================
// 3. Record an evaluation (Evaluate phase)
// =========================================================
export const recordEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      microConceptId: z.string().uuid(),
      quizId: z.string().uuid().nullable().optional(),
      score: z.number().min(0),
      total: z.number().min(0),
      perQuestion: z.array(
        z.object({
          questionId: z.string(),
          correct: z.boolean(),
          subSkill: z.string().optional(),
        }),
      ).default([]),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const session = await getOrCreateSession(supabase, userId, data.microConceptId);

    const { error } = await supabase.from("evaluation_attempts").insert({
      session_id: session.id,
      student_id: userId,
      quiz_id: data.quizId ?? null,
      score: data.score,
      total: data.total,
      per_question: data.perQuestion,
    });
    if (error) throw new Error(error.message);

    await supabase
      .from("learning_sessions")
      .update({ state: "evaluating", last_event_at: new Date().toISOString() })
      .eq("id", session.id);

    return { sessionId: session.id };
  });

// =========================================================
// 4. Analyse weakness (Analyse phase)
// =========================================================
const WeaknessSchema = z.object({
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  notes: z.string().default(""),
  mastered: z.boolean(),
});
type WeaknessResult = z.infer<typeof WeaknessSchema>;

export const analyseWeakness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const mc = await getMicroConcept(supabase, data.microConceptId);
    const session = await getOrCreateSession(supabase, userId, data.microConceptId);

    const [{ data: recalls }, { data: evals }] = await Promise.all([
      supabase
        .from("recollection_attempts")
        .select("ai_score, ai_feedback, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("evaluation_attempts")
        .select("score, total, per_question, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const lastRecall = (recalls ?? [])[0];
    const lastEval = (evals ?? [])[0];
    const recallScore = Number(lastRecall?.ai_score ?? 0);
    const evalScore =
      lastEval && lastEval.total > 0 ? Number(lastEval.score) / Number(lastEval.total) : 0;
    const heuristicMastered = recallScore >= 0.7 && evalScore >= 0.8;

    const result = await aiJson<WeaknessResult>([
      {
        role: "system",
        content:
          "You diagnose a student's weakness on a single micro-concept based on their latest recall + quiz signals. " +
          'Return strict JSON: {"tags":[short labels],"confidence":0..1,"notes":"plain-English diagnosis","mastered":boolean}. ' +
          "Tags should be short (2-4 words), specific sub-skills (e.g. 'sign errors', 'formula confusion').",
      },
      {
        role: "user",
        content: JSON.stringify({
          microConcept: { title: mc.title, objective: mc.learning_objective },
          recallScore,
          recallFeedback: lastRecall?.ai_feedback ?? null,
          evalScore,
          perQuestion: lastEval?.per_question ?? [],
          heuristicMastered,
        }),
      },
    ]);
    const parsed = WeaknessSchema.parse(result);
    const mastered = parsed.mastered && heuristicMastered;
    const mastery = Math.max(0, Math.min(1, 0.5 * recallScore + 0.5 * evalScore));

    await supabase.from("weakness_profile").upsert(
      {
        student_id: userId,
        micro_concept_id: data.microConceptId,
        weakness_tags: parsed.tags,
        confidence: parsed.confidence,
        notes: parsed.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,micro_concept_id" },
    );

    await supabase
      .from("learning_sessions")
      .update({
        state: mastered ? "mastered" : "weak",
        mastery,
        last_event_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return { sessionId: session.id, mastered, mastery, weakness: parsed };
  });

// =========================================================
// 5. Generate targeted remediation (AI material phase)
// =========================================================
const RemediationSchema = z.object({
  reexplain: z.object({ summary: z.string(), analogies: z.array(z.string()).default([]), workedExample: z.string().optional() }),
  practice: z.array(
    z.object({
      prompt: z.string(),
      type: z.enum(["mcq", "short"]),
      options: z.array(z.string()).optional(),
      answer: z.string(),
      explanation: z.string(),
    }),
  ).default([]),
  solutionWalkthroughs: z.array(z.object({ question: z.string(), steps: z.array(z.string()) })).default([]),
  diagramPrompt: z.string().optional(),
});
type RemediationResult = z.infer<typeof RemediationSchema>;

export const generateRemediation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const mc = await getMicroConcept(supabase, data.microConceptId);
    const session = await getOrCreateSession(supabase, userId, data.microConceptId);

    const { data: weakness } = await supabase
      .from("weakness_profile")
      .select("weakness_tags, notes")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    const result = await aiJson<RemediationResult>([
      {
        role: "system",
        content:
          "You are a personalised tutor. Generate targeted remediation for ONE micro-concept based on the student's diagnosed weaknesses. " +
          'Return strict JSON with shape: {"reexplain":{"summary":"","analogies":[],"workedExample":""},' +
          '"practice":[{"prompt":"","type":"mcq"|"short","options":["..."],"answer":"","explanation":""}],' +
          '"solutionWalkthroughs":[{"question":"","steps":["..."]}],"diagramPrompt":"..."}. ' +
          "Produce 3 practice items and 1 worked walkthrough. Keep language age-appropriate.",
      },
      {
        role: "user",
        content: JSON.stringify({
          microConcept: { title: mc.title, objective: mc.learning_objective, content: mc.content_md, difficulty: mc.difficulty },
          weaknessTags: weakness?.weakness_tags ?? [],
          weaknessNotes: weakness?.notes ?? "",
        }),
      },
    ]);
    const parsed = RemediationSchema.parse(result);

    const rows = [
      { kind: "reexplain" as const, payload: parsed.reexplain },
      { kind: "practice" as const, payload: { items: parsed.practice } },
      { kind: "solution_walkthrough" as const, payload: { items: parsed.solutionWalkthroughs } },
      ...(parsed.diagramPrompt
        ? [{ kind: "diagram_prompt" as const, payload: { prompt: parsed.diagramPrompt } }]
        : []),
    ].map((r) => ({
      session_id: session.id,
      student_id: userId,
      kind: r.kind,
      payload: r.payload,
      model: AI_MODEL_DEFAULT,
    }));
    if (rows.length) {
      const { error } = await supabase.from("ai_generated_material").insert(rows);
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("learning_sessions")
      .update({ state: "remediating", last_event_at: new Date().toISOString() })
      .eq("id", session.id);

    return { sessionId: session.id, material: parsed };
  });

// =========================================================
// 6. Next-best micro-concept (Recommendation)
// =========================================================
export const nextMicroConcept = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Prefer in-progress weak sessions; fall back to the next never-touched
    // micro-concept whose prerequisites are mastered.
    const { data: weak } = await supabase
      .from("learning_sessions")
      .select("micro_concept_id, mastery, state, micro_concepts(id, title)")
      .eq("student_id", userId)
      .in("state", ["weak", "remediating", "evaluating", "studying", "recollecting"])
      .order("mastery", { ascending: true })
      .limit(1);
    if (weak && weak[0]) {
      return {
        kind: "continue" as const,
        microConceptId: weak[0].micro_concept_id,
        title: (weak[0] as any).micro_concepts?.title ?? "Continue practice",
      };
    }

    const { data: candidates } = await supabase
      .from("micro_concepts")
      .select("id, title, prerequisite_ids, order_index")
      .order("order_index", { ascending: true })
      .limit(50);
    const { data: mastered } = await supabase
      .from("learning_sessions")
      .select("micro_concept_id")
      .eq("student_id", userId)
      .eq("state", "mastered");
    const masteredSet = new Set((mastered ?? []).map((r: any) => r.micro_concept_id));

    const next = (candidates ?? []).find((c: any) => {
      if (masteredSet.has(c.id)) return false;
      const prereqs = (c.prerequisite_ids ?? []) as string[];
      return prereqs.every((p) => masteredSet.has(p));
    });
    if (!next) return { kind: "none" as const };
    return { kind: "start" as const, microConceptId: next.id, title: next.title };
  });
