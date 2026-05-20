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
  subSkills: z.array(z.object({ name: z.string(), severity: z.number().min(0).max(1) })).default([]),
  rootCauses: z.array(z.string()).default([]),
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

    // Pull a broader window so trend + sub-skill rollup is real.
    const [{ data: recalls }, { data: evals }, { data: priorWeakness }] = await Promise.all([
      supabase
        .from("recollection_attempts")
        .select("ai_score, ai_feedback, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("evaluation_attempts")
        .select("score, total, per_question, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("weakness_profile")
        .select("weakness_tags, confidence, notes, updated_at")
        .eq("student_id", userId)
        .eq("micro_concept_id", data.microConceptId)
        .maybeSingle(),
    ]);

    const recallScores = (recalls ?? []).map((r: any) => Number(r.ai_score) || 0);
    const evalScores = (evals ?? [])
      .map((e: any) => (e.total > 0 ? Number(e.score) / Number(e.total) : 0));
    const recallAvg = recallScores.length
      ? recallScores.reduce((a, b) => a + b, 0) / recallScores.length
      : 0;
    const evalAvg = evalScores.length
      ? evalScores.reduce((a, b) => a + b, 0) / evalScores.length
      : 0;
    const lastRecall = (recalls ?? [])[0];
    const lastEval = (evals ?? [])[0];
    const lastRecallScore = Number(lastRecall?.ai_score) || 0;
    const lastEvalScore =
      lastEval && lastEval.total > 0 ? Number(lastEval.score) / Number(lastEval.total) : 0;

    // Per-sub-skill error tally across recent eval attempts.
    const subSkillErrors = new Map<string, number>();
    for (const e of evals ?? []) {
      for (const q of ((e.per_question as any[]) ?? [])) {
        if (q?.correct === false && q?.subSkill) {
          subSkillErrors.set(q.subSkill, (subSkillErrors.get(q.subSkill) ?? 0) + 1);
        }
      }
    }
    const subSkillRollup = Array.from(subSkillErrors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // Heuristic mastery: needs recent AND sustained performance.
    const heuristicMastered =
      lastRecallScore >= 0.7 &&
      lastEvalScore >= 0.8 &&
      recallAvg >= 0.65 &&
      evalAvg >= 0.7;

    const result = await aiJson<WeaknessResult>([
      {
        role: "system",
        content:
          "You diagnose a student's weakness on a single micro-concept using multi-attempt signals. " +
          'Return strict JSON: {"tags":[short labels],"subSkills":[{"name":"","severity":0..1}],' +
          '"rootCauses":[short phrases],"confidence":0..1,"notes":"plain-English diagnosis (2-3 sentences)","mastered":boolean}. ' +
          "Tags should be short (2-4 words) specific sub-skills (e.g. 'sign errors', 'formula confusion'). " +
          "rootCauses must explain WHY the gap exists (e.g. 'confuses prerequisite X'). " +
          "Only set mastered=true if BOTH heuristicMastered=true AND the trend is non-decreasing.",
      },
      {
        role: "user",
        content: JSON.stringify({
          microConcept: { title: mc.title, objective: mc.learning_objective },
          recallAvg,
          evalAvg,
          lastRecallScore,
          lastEvalScore,
          recallTrend: recallScores.slice(0, 4),
          evalTrend: evalScores.slice(0, 4),
          lastRecallFeedback: lastRecall?.ai_feedback ?? null,
          subSkillErrors: subSkillRollup,
          priorWeakness: priorWeakness ?? null,
          heuristicMastered,
        }),
      },
    ]);
    const parsed = WeaknessSchema.parse(result);
    const mastered = parsed.mastered && heuristicMastered;

    // Blended mastery — weights sustained performance higher than the last shot.
    const mastery = Math.max(
      0,
      Math.min(
        1,
        0.30 * lastRecallScore +
          0.30 * lastEvalScore +
          0.20 * recallAvg +
          0.20 * evalAvg,
      ),
    );

    // Merge prior tags so weakness profile compounds across attempts.
    const mergedTags = Array.from(
      new Set<string>([...(parsed.tags ?? []), ...((priorWeakness as any)?.weakness_tags ?? [])]),
    ).slice(0, 12);

    const richNotes = [
      parsed.notes,
      parsed.rootCauses?.length ? `Root causes: ${parsed.rootCauses.join("; ")}` : "",
      parsed.subSkills?.length
        ? `Sub-skills: ${parsed.subSkills.map((s) => `${s.name} (${Math.round(s.severity * 100)}%)`).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    await supabase.from("weakness_profile").upsert(
      {
        student_id: userId,
        micro_concept_id: data.microConceptId,
        weakness_tags: mergedTags,
        confidence: parsed.confidence,
        notes: richNotes,
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

    // Update concept_mastery streak/confidence so retention math picks it up.
    const { data: existingMastery } = await supabase
      .from("concept_mastery")
      .select("streak")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();
    const nextStreak = mastered ? (existingMastery?.streak ?? 0) + 1 : 0;
    await supabase
      .from("concept_mastery")
      .upsert(
        {
          student_id: userId,
          micro_concept_id: data.microConceptId,
          mastery,
          confidence: parsed.confidence,
          streak: nextStreak,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,micro_concept_id" },
      );

    return {
      sessionId: session.id,
      mastered,
      mastery,
      weakness: { ...parsed, tags: mergedTags },
      signals: { recallAvg, evalAvg, lastRecallScore, lastEvalScore, subSkillRollup },
    };
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

    // 1. Continue any active weak/in-progress session first.
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
        reason: "Active session below mastery threshold",
      };
    }

    // 2. Use the intelligence sequencer on mastery history.
    const { data: mastery } = await supabase
      .from("concept_mastery")
      .select(`
        micro_concept_id, mastery, confidence, streak, last_practiced_at, decay_at,
        micro_concepts:micro_concept_id (
          id, title, difficulty, estimated_minutes, tags, prerequisite_ids, concept_id
        )
      `)
      .eq("student_id", userId);

    if (mastery && mastery.length) {
      const { personalizedSequence } = await import("./ai/intelligence.server");
      const ids = mastery.map((r: any) => r.micro_concept_id);
      const [{ data: rels }, { data: recalls }, { data: weaknesses }] = await Promise.all([
        supabase
          .from("concept_relations")
          .select("source_id, target_id, relation, weight")
          .in("source_id", ids),
        supabase
          .from("recollection_attempts")
          .select("ai_score, ai_feedback, created_at")
          .eq("student_id", userId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("weakness_profile")
          .select("micro_concept_id, weakness_tags, confidence, notes, updated_at")
          .eq("student_id", userId),
      ]);
      const seq = personalizedSequence({
        rows: mastery.map((r: any) => ({
          microConceptId: r.micro_concept_id,
          title: r.micro_concepts?.title ?? "Micro-concept",
          conceptId: r.micro_concepts?.concept_id ?? null,
          difficulty: r.micro_concepts?.difficulty ?? 1,
          estimatedMinutes: r.micro_concepts?.estimated_minutes ?? 8,
          tags: r.micro_concepts?.tags ?? [],
          prerequisiteIds: r.micro_concepts?.prerequisite_ids ?? [],
          mastery: Number(r.mastery) || 0,
          confidence: Number(r.confidence) || 0,
          streak: Number(r.streak) || 0,
          lastPracticedAt: r.last_practiced_at,
          decayAt: r.decay_at,
        })),
        recentRecalls: (recalls ?? []).map((r: any) => ({
          score: Number(r.ai_score) || 0,
          feedback: r.ai_feedback ?? null,
          createdAt: r.created_at,
        })),
        weaknesses: (weaknesses ?? []).map((w: any) => ({
          microConceptId: w.micro_concept_id,
          tags: w.weakness_tags ?? [],
          confidence: Number(w.confidence) || 0,
          notes: w.notes,
          updatedAt: w.updated_at,
        })),
        edges: (rels ?? []).map((r: any) => ({
          source: r.source_id,
          target: r.target_id,
          relation: r.relation,
          weight: Number(r.weight) || 1,
        })),
        topK: 1,
      });
      if (seq[0]) {
        return {
          kind: "smart" as const,
          microConceptId: seq[0].microConceptId,
          title: seq[0].title,
          reason: seq[0].reason,
        };
      }
    }

    // 3. Fallback: first prerequisite-met micro-concept.
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
