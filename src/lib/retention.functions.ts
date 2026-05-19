/**
 * Retention Optimization Engine
 *
 * Implements spaced repetition + forgetting-curve modeling on top of
 * concept_mastery / recollection_attempts / evaluation_attempts.
 *
 * Math sketch (Ebbinghaus-style):
 *   stability S  = base * (1 + streak)^0.5 * (0.5 + mastery)
 *   retrievability R(t) = exp(-elapsedDays / S)
 *   forgetProb = 1 - R
 *   nextReviewDays = S * ln(1 / targetR)     // targetR = 0.9
 *
 * Confidence and recent recall scores nudge S up/down so the schedule
 * adapts in real time.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJson } from "./ai-gateway.server";

const TARGET_RETRIEVABILITY = 0.9;
const MS_PER_DAY = 86_400_000;

type MasteryRow = {
  micro_concept_id: string;
  mastery: number;
  confidence: number;
  streak: number;
  decay_at: string | null;
  last_practiced_at: string | null;
  micro_concepts: {
    title: string;
    estimated_minutes: number;
    difficulty: number;
    bloom_level: string | null;
    concept_id: string;
  } | null;
};

function computeMemory(row: MasteryRow, recentRecallAvg: number | null) {
  const mastery = Number(row.mastery) || 0;
  const confidence = Number(row.confidence) || 0;
  const streak = Math.max(0, Number(row.streak) || 0);
  const last = row.last_practiced_at ? new Date(row.last_practiced_at).getTime() : null;
  const elapsedDays = last ? Math.max(0, (Date.now() - last) / MS_PER_DAY) : 9999;

  // Base stability in days — tuned so a freshly mastered concept with no
  // streak sits around 1 day, and grows with streak + mastery.
  const baseStability = 1.0;
  const masteryBoost = 0.5 + mastery; // 0.5 .. 1.5
  const streakBoost = Math.sqrt(1 + streak); // 1, 1.41, 1.73...
  const confidenceBoost = 0.75 + confidence * 0.5; // 0.75 .. 1.25
  const recallBoost = recentRecallAvg == null ? 1 : 0.7 + recentRecallAvg * 0.6;

  const stability = baseStability * masteryBoost * streakBoost * confidenceBoost * recallBoost;
  const retrievability = Math.exp(-elapsedDays / Math.max(stability, 0.25));
  const forgetProb = 1 - retrievability;

  const nextReviewDays = stability * Math.log(1 / TARGET_RETRIEVABILITY);
  const dueAt = last
    ? new Date(last + nextReviewDays * MS_PER_DAY)
    : new Date(Date.now());

  // Memory strength: blend of stability (capped) and retrievability.
  const memoryStrength = Math.max(
    0,
    Math.min(1, 0.6 * Math.tanh(stability / 14) + 0.4 * retrievability),
  );

  return {
    stability,
    retrievability,
    forgetProb,
    memoryStrength,
    elapsedDays,
    nextReviewDays,
    dueAt,
  };
}

function bucket(forgetProb: number) {
  if (forgetProb >= 0.6) return "critical" as const;
  if (forgetProb >= 0.35) return "weak" as const;
  if (forgetProb >= 0.15) return "fading" as const;
  return "stable" as const;
}

/** Full retention analytics payload for the planner dashboard. */
export const getRetentionAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: mastery }, { data: recalls }] = await Promise.all([
      supabase
        .from("concept_mastery")
        .select(`
          micro_concept_id, mastery, confidence, streak, decay_at, last_practiced_at,
          micro_concepts:micro_concept_id (
            title, estimated_minutes, difficulty, bloom_level, concept_id
          )
        `)
        .eq("student_id", userId),
      supabase
        .from("recollection_attempts")
        .select("ai_score, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const rows = (mastery ?? []) as unknown as MasteryRow[];
    const recallScores = (recalls ?? [])
      .map((r: any) => Number(r.ai_score))
      .filter((n) => Number.isFinite(n));
    const recentRecallAvg = recallScores.length
      ? recallScores.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, recallScores.length)
      : null;

    const items = rows.map((r) => {
      const memo = computeMemory(r, recentRecallAvg);
      return {
        microConceptId: r.micro_concept_id,
        title: r.micro_concepts?.title ?? "Untitled",
        difficulty: r.micro_concepts?.difficulty ?? 1,
        estimatedMinutes: r.micro_concepts?.estimated_minutes ?? 8,
        mastery: Number(r.mastery) || 0,
        confidence: Number(r.confidence) || 0,
        streak: Number(r.streak) || 0,
        lastPracticedAt: r.last_practiced_at,
        ...memo,
        dueAt: memo.dueAt.toISOString(),
        bucket: bucket(memo.forgetProb),
      };
    });

    // Aggregates
    const total = items.length;
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const avgMemoryStrength = avg(items.map((i) => i.memoryStrength));
    const avgForget = avg(items.map((i) => i.forgetProb));
    const avgStability = avg(items.map((i) => i.stability));

    const now = Date.now();
    const dueNow = items.filter((i) => new Date(i.dueAt).getTime() <= now).length;
    const dueIn24h = items.filter(
      (i) => new Date(i.dueAt).getTime() <= now + MS_PER_DAY,
    ).length;
    const dueIn7d = items.filter(
      (i) => new Date(i.dueAt).getTime() <= now + 7 * MS_PER_DAY,
    ).length;

    const buckets = {
      critical: items.filter((i) => i.bucket === "critical").length,
      weak: items.filter((i) => i.bucket === "weak").length,
      fading: items.filter((i) => i.bucket === "fading").length,
      stable: items.filter((i) => i.bucket === "stable").length,
    };

    // 14-day forecast heatmap: predicted retention each day given no review.
    const horizon = 14;
    const forecast = Array.from({ length: horizon }, (_, day) => {
      const t = day; // days from now
      const probs = items.map((i) => {
        const elapsed = i.elapsedDays + t;
        return Math.exp(-elapsed / Math.max(i.stability, 0.25));
      });
      return {
        day,
        avgRetention: avg(probs),
        atRisk: probs.filter((p) => p < 0.7).length,
      };
    });

    // Smart reminders: pick top forget-risk items capped by daily budget.
    const dailyMinutesBudget = 25;
    let used = 0;
    const todayPlan = [...items]
      .sort((a, b) => b.forgetProb - a.forgetProb)
      .filter((i) => {
        if (used + i.estimatedMinutes > dailyMinutesBudget) return false;
        used += i.estimatedMinutes;
        return true;
      })
      .slice(0, 8);

    return {
      summary: {
        total,
        avgMemoryStrength,
        avgForgetProbability: avgForget,
        avgStabilityDays: avgStability,
        dueNow,
        dueIn24h,
        dueIn7d,
        recentRecallAvg,
      },
      buckets,
      items: items.sort((a, b) => b.forgetProb - a.forgetProb),
      forecast,
      todayPlan,
      generatedAt: new Date().toISOString(),
    };
  });

/** Persist AI-tuned next-review timestamps onto concept_mastery.decay_at. */
export const applyRevisionSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      items: z
        .array(z.object({ microConceptId: z.string().uuid(), dueAt: z.string() }))
        .min(1)
        .max(50),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.items.map((i) => ({
      student_id: userId,
      micro_concept_id: i.microConceptId,
      decay_at: i.dueAt,
    }));
    const { error } = await supabase
      .from("concept_mastery")
      .upsert(rows, { onConflict: "student_id,micro_concept_id" });
    if (error) throw new Error(error.message);
    return { updated: rows.length };
  });

/** Ask the AI to refine the daily revision plan with reasoning. */
export const generateAiRevisionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ minutes: z.number().int().min(5).max(180).default(25) }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: mastery } = await supabase
      .from("concept_mastery")
      .select(`
        micro_concept_id, mastery, confidence, streak, last_practiced_at,
        micro_concepts:micro_concept_id ( title, estimated_minutes, difficulty )
      `)
      .eq("student_id", userId);

    const rows = (mastery ?? []) as unknown as MasteryRow[];
    const enriched = rows.map((r) => {
      const memo = computeMemory(r, null);
      return {
        microConceptId: r.micro_concept_id,
        title: r.micro_concepts?.title ?? "Untitled",
        estimatedMinutes: r.micro_concepts?.estimated_minutes ?? 8,
        difficulty: r.micro_concepts?.difficulty ?? 1,
        mastery: Number(r.mastery) || 0,
        confidence: Number(r.confidence) || 0,
        forgetProb: memo.forgetProb,
        stabilityDays: memo.stability,
      };
    });

    if (!enriched.length) {
      return { plan: [], rationale: "No mastery history yet. Start a learning session to seed the planner." };
    }

    const candidates = enriched
      .sort((a, b) => b.forgetProb - a.forgetProb)
      .slice(0, 20);

    const ai = await aiJson<{
      plan: Array<{
        microConceptId: string;
        order: number;
        reason: string;
        suggestedMinutes: number;
        nextReviewInDays: number;
      }>;
      rationale: string;
    }>([
      {
        role: "system",
        content:
          "You are an adaptive learning coach. Build a daily spaced-repetition plan that maximizes long-term retention. Return STRICT JSON: { plan: [{microConceptId, order, reason, suggestedMinutes, nextReviewInDays}], rationale }. Respect the total minute budget. Prioritize items with high forget probability and low confidence; interleave difficulty.",
      },
      {
        role: "user",
        content: JSON.stringify({ budgetMinutes: data.minutes, candidates }),
      },
    ]);

    // Persist updated review schedule.
    const updates = ai.plan
      .filter((p) => Number.isFinite(p.nextReviewInDays) && p.nextReviewInDays > 0)
      .map((p) => ({
        student_id: userId,
        micro_concept_id: p.microConceptId,
        decay_at: new Date(Date.now() + p.nextReviewInDays * MS_PER_DAY).toISOString(),
      }));
    if (updates.length) {
      await supabase
        .from("concept_mastery")
        .upsert(updates, { onConflict: "student_id,micro_concept_id" });
    }

    return ai;
  });
