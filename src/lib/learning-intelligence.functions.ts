/**
 * Learning Intelligence Analytics System
 *
 * Unified telemetry across the 8 measurable signals:
 *   1. Learning patterns       — daily/weekly study cadence + session quality
 *   2. Weakness trends         — rolling tag-cluster severity over time
 *   3. Revision effectiveness  — pre/post recall delta per concept
 *   4. Recall strength         — moving avg of recollection_attempts
 *   5. Retention decay         — Ebbinghaus-derived R(7d) + risk count
 *   6. Concept mastery         — band distribution + average
 *   7. Time efficiency         — minutes per +1% mastery
 *   8. Engagement              — sessions/week, streak, consistency
 *
 * Returns insight cards, predictions, recommendations, and a parent-report
 * payload — all in a single round-trip, RLS-safe via requireSupabaseAuth.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  behaviorSignals,
  clusterWeaknesses,
  personalizedSequence,
  predictRetention,
  type EvalSignal,
  type MasteryRow,
  type RecallSignal,
  type RelationEdge,
  type WeaknessRow,
} from "./ai/intelligence.server";
import { aiCall } from "./ai/core.server";

const DAY = 86_400_000;

type Granularity = "day" | "week";
type TrendPoint = {
  label: string;
  startISO: string;
  endISO: string;
  attempts: number;
  recallScore: number;     // 0..1 avg
  evalAccuracy: number;    // 0..1 avg
  minutes: number;
  sessions: number;
  weaknessCount: number;
  newTagsLogged: number;
};

function buildBuckets(days: number, granularity: Granularity): TrendPoint[] {
  const out: TrendPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const step = granularity === "week" ? 7 : 1;
  const n = Math.ceil(days / step);
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(today.getTime() - i * step * DAY + DAY - 1);
    const start = new Date(end.getTime() - step * DAY + 1);
    out.push({
      label:
        granularity === "week"
          ? `W${n - i}`
          : start.toISOString().slice(5, 10),
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      attempts: 0,
      recallScore: 0,
      evalAccuracy: 0,
      minutes: 0,
      sessions: 0,
      weaknessCount: 0,
      newTagsLogged: 0,
    });
  }
  return out;
}

function bucketFor(buckets: TrendPoint[], iso: string | null | undefined): TrendPoint | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  for (const b of buckets) {
    if (t >= new Date(b.startISO).getTime() && t <= new Date(b.endISO).getTime()) return b;
  }
  return null;
}

async function computeIntelligence(
  supabase: any,
  studentId: string,
  opts: { windowDays: number; granularity: Granularity },
) {
  const sinceISO = new Date(Date.now() - opts.windowDays * DAY).toISOString();

  const [
    masteryRes,
    recallsRes,
    evalsRes,
    weaknessRes,
    sessionsRes,
    attemptsRes,
  ] = await Promise.all([
    supabase
      .from("concept_mastery")
      .select(`
        micro_concept_id, mastery, confidence, streak, last_practiced_at, decay_at, updated_at,
        micro_concepts:micro_concept_id (
          id, title, difficulty, estimated_minutes, tags, prerequisite_ids, concept_id
        )
      `)
      .eq("student_id", studentId),
    supabase
      .from("recollection_attempts")
      .select("ai_score, ai_feedback, created_at, session_id")
      .eq("student_id", studentId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    supabase
      .from("evaluation_attempts")
      .select("score, total, per_question, created_at, session_id")
      .eq("student_id", studentId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    supabase
      .from("weakness_profile")
      .select("micro_concept_id, weakness_tags, confidence, notes, updated_at")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(60),
    supabase
      .from("learning_sessions")
      .select("id, state, attempts, mastery, micro_concept_id, updated_at, last_event_at, created_at")
      .eq("student_id", studentId)
      .gte("last_event_at", sinceISO),
    supabase
      .from("quiz_attempts")
      .select("score, total, submitted_at, quiz_id, quizzes(subject_id, subjects(name))")
      .eq("student_id", studentId)
      .gte("submitted_at", sinceISO)
      .order("submitted_at", { ascending: false }),
  ]);

  const mastery = masteryRes.data ?? [];
  const recalls = recallsRes.data ?? [];
  const evals = evalsRes.data ?? [];
  const weaknesses = weaknessRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  // --- Domain transforms ---
  const rows: MasteryRow[] = mastery.map((r: any) => ({
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
  }));

  const recallSignals: RecallSignal[] = recalls.map((r: any) => ({
    score: Number(r.ai_score) || 0,
    feedback: r.ai_feedback ?? null,
    createdAt: r.created_at,
  }));
  const evalSignals: EvalSignal[] = evals.map((e: any) => ({
    score: Number(e.score) || 0,
    total: Number(e.total) || 0,
    perQuestion: (e.per_question as any[]) ?? [],
    createdAt: e.created_at,
  }));
  const weaknessRows: WeaknessRow[] = weaknesses.map((w: any) => ({
    microConceptId: w.micro_concept_id,
    tags: w.weakness_tags ?? [],
    confidence: Number(w.confidence) || 0,
    notes: w.notes,
    updatedAt: w.updated_at,
  }));

  // --- Buckets / trends ---
  const buckets = buildBuckets(opts.windowDays, opts.granularity);

  for (const a of attempts) {
    const b = bucketFor(buckets, a.submitted_at);
    if (!b) continue;
    b.attempts += 1;
    b.evalAccuracy += a.total ? Number(a.score) / Number(a.total) : 0;
    b.minutes += 8;
  }
  for (const r of recalls) {
    const b = bucketFor(buckets, r.created_at);
    if (!b) continue;
    b.recallScore += Number(r.ai_score) || 0;
    b.sessions += 0; // counted separately
  }
  for (const e of evals) {
    const b = bucketFor(buckets, e.created_at);
    if (!b) continue;
    b.evalAccuracy += e.total ? Number(e.score) / Number(e.total) : 0;
    b.minutes += 5;
  }
  for (const s of sessions) {
    const b = bucketFor(buckets, s.last_event_at ?? s.updated_at);
    if (!b) continue;
    b.sessions += 1;
    b.minutes += Math.max(2, Number(s.attempts) || 0) * 3;
  }
  for (const w of weaknesses) {
    const b = bucketFor(buckets, w.updated_at);
    if (!b) continue;
    b.weaknessCount += 1;
    b.newTagsLogged += (w.weakness_tags ?? []).length;
  }
  // Normalize averages
  for (const b of buckets) {
    const recallSamples = recalls.filter((r: any) => bucketFor(buckets, r.created_at) === b).length;
    const evalSamples =
      attempts.filter((a: any) => bucketFor(buckets, a.submitted_at) === b).length +
      evals.filter((e: any) => bucketFor(buckets, e.created_at) === b).length;
    b.recallScore = recallSamples ? b.recallScore / recallSamples : 0;
    b.evalAccuracy = evalSamples ? b.evalAccuracy / evalSamples : 0;
  }

  // --- 1. Mastery bands + average ---
  const bands = { mastered: 0, proficient: 0, developing: 0, weak: 0 };
  for (const r of rows) {
    if (r.mastery >= 0.85) bands.mastered++;
    else if (r.mastery >= 0.6) bands.proficient++;
    else if (r.mastery >= 0.35) bands.developing++;
    else bands.weak++;
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const avgMastery = avg(rows.map((r) => r.mastery));
  const avgConfidence = avg(rows.map((r) => r.confidence));

  // --- 2. Retention decay ---
  const retentionPerConcept = rows.map((r) => predictRetention({ row: r, recentRecalls: recallSignals }));
  const avgR7d = avg(retentionPerConcept.map((r) => r.r7d));
  const avgR30d = avg(retentionPerConcept.map((r) => r.r30d));
  const atRisk = retentionPerConcept.filter((r) => r.r7d < 0.7).length;
  const criticalRisk = retentionPerConcept.filter((r) => r.riskScore > 0.6).length;
  const upcomingReviews = rows
    .map((r, i) => ({
      microConceptId: r.microConceptId,
      title: r.title,
      mastery: r.mastery,
      reviewAt: retentionPerConcept[i].recommendedReviewAt,
      r7d: retentionPerConcept[i].r7d,
      risk: retentionPerConcept[i].riskScore,
    }))
    .sort((a, b) => +new Date(a.reviewAt) - +new Date(b.reviewAt))
    .slice(0, 8);

  // --- 3. Recall strength (moving averages) ---
  const recallMA = (() => {
    if (!recallSignals.length) return { current: 0, prior: 0, delta: 0 };
    const half = Math.max(1, Math.floor(recallSignals.length / 2));
    const prior = avg(recallSignals.slice(0, half).map((s) => s.score));
    const current = avg(recallSignals.slice(-half).map((s) => s.score));
    return { current, prior, delta: current - prior };
  })();

  // --- 4. Revision effectiveness (per session: 1st vs last recall score) ---
  const bySession = new Map<string, RecallSignal[]>();
  for (const r of recalls) {
    if (!r.session_id) continue;
    const list = bySession.get(r.session_id) ?? [];
    list.push({ score: Number(r.ai_score) || 0, feedback: r.ai_feedback ?? null, createdAt: r.created_at });
    bySession.set(r.session_id, list);
  }
  const sessionDeltas: number[] = [];
  bySession.forEach((list) => {
    if (list.length < 2) return;
    const sorted = list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    sessionDeltas.push(sorted[sorted.length - 1].score - sorted[0].score);
  });
  const revisionEffectiveness = {
    sessionsWithRevisits: sessionDeltas.length,
    avgGain: avg(sessionDeltas),
    successRate: sessionDeltas.length
      ? sessionDeltas.filter((d) => d > 0.1).length / sessionDeltas.length
      : 0,
  };

  // --- 5. Weakness trends (cluster severity over time) ---
  const clusters = clusterWeaknesses(weaknessRows).slice(0, 10);
  const tagSeries = (() => {
    const top = clusters.slice(0, 5).map((c) => c.tag);
    const series = top.map((tag) => ({
      tag,
      points: buckets.map((b) => ({
        label: b.label,
        count: weaknesses.filter(
          (w: any) =>
            (w.weakness_tags ?? []).includes(tag) &&
            bucketFor(buckets, w.updated_at) === b,
        ).length,
      })),
    }));
    return series;
  })();

  // --- 6. Time efficiency ---
  const totalMinutes = buckets.reduce((s, b) => s + b.minutes, 0);
  const masteryGained = avg(rows.map((r) => Math.max(0, r.mastery - 0))); // proxy
  const minutesPerPercent =
    avgMastery > 0 ? totalMinutes / Math.max(1, avgMastery * 100) : 0;

  // --- 7. Engagement / patterns ---
  const behavior = behaviorSignals({ recalls: recallSignals, evals: evalSignals });
  const activeDays = new Set(
    [
      ...recalls.map((r: any) => (r.created_at as string).slice(0, 10)),
      ...evals.map((e: any) => (e.created_at as string).slice(0, 10)),
      ...attempts.map((a: any) => (a.submitted_at as string).slice(0, 10)),
    ],
  ).size;
  const consistency = activeDays / Math.max(1, opts.windowDays);
  let streak = 0;
  const dayActivity = new Set<string>([
    ...recalls.map((r: any) => (r.created_at as string).slice(0, 10)),
    ...evals.map((e: any) => (e.created_at as string).slice(0, 10)),
    ...attempts.map((a: any) => (a.submitted_at as string).slice(0, 10)),
  ]);
  for (let i = 0; i < opts.windowDays; i++) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    if (dayActivity.has(d)) streak++;
    else break;
  }

  // --- 8. Personalized sequencing ---
  const ids = rows.map((r) => r.microConceptId);
  let edges: RelationEdge[] = [];
  if (ids.length) {
    const { data: rels } = await supabase
      .from("concept_relations")
      .select("source_id, target_id, relation, weight")
      .in("source_id", ids);
    edges = (rels ?? []).map((r: any) => ({
      source: r.source_id,
      target: r.target_id,
      relation: r.relation,
      weight: Number(r.weight) || 1,
    }));
  }
  const sequence = personalizedSequence({
    rows,
    recentRecalls: recallSignals,
    weaknesses: weaknessRows,
    edges,
    topK: 6,
  });

  // --- Predictions (next-week projection) ---
  const trendAcc = (() => {
    const valid = buckets.filter((b) => b.evalAccuracy > 0 || b.recallScore > 0);
    if (valid.length < 2) return 0;
    const half = Math.floor(valid.length / 2);
    const recent = avg(valid.slice(-half).map((b) => Math.max(b.evalAccuracy, b.recallScore)));
    const old = avg(valid.slice(0, half).map((b) => Math.max(b.evalAccuracy, b.recallScore)));
    return recent - old;
  })();
  const predictions = {
    nextWeekMastery: Math.min(1, avgMastery + trendAcc * 0.5 + (recallMA.delta || 0) * 0.2),
    nextWeekRetention: Math.min(1, avgR7d + (recallMA.delta || 0) * 0.3),
    masteryTrend: trendAcc,
    confidenceLevel: behavior.depth > 0.6 && consistency > 0.4 ? "high" : behavior.depth > 0.4 ? "medium" : "low",
  };

  // --- KPIs summary ---
  const summary = {
    trackedConcepts: rows.length,
    avgMastery,
    avgConfidence,
    avgRecall: avg(recallSignals.map((r) => r.score)),
    avgRetention7d: avgR7d,
    avgRetention30d: avgR30d,
    atRisk,
    criticalRisk,
    totalMinutes,
    minutesPerPercent,
    activeDays,
    consistency,
    streak,
    sessionsCount: sessions.length,
    attemptsCount: attempts.length,
    weaknessClusters: clusters.length,
    dominantWeakness: clusters[0]?.tag ?? null,
  };

  // --- Rule-based insights & recommendations ---
  const insights: { kind: "win" | "risk" | "info"; message: string }[] = [];
  if (predictions.masteryTrend > 0.05)
    insights.push({ kind: "win", message: `Mastery trending up ${Math.round(predictions.masteryTrend * 100)}%.` });
  if (predictions.masteryTrend < -0.05)
    insights.push({ kind: "risk", message: `Performance dipped ${Math.round(-predictions.masteryTrend * 100)}%.` });
  if (atRisk > 0)
    insights.push({ kind: "risk", message: `${atRisk} concept${atRisk > 1 ? "s" : ""} at retention risk this week.` });
  if (streak >= 5) insights.push({ kind: "win", message: `${streak}-day streak — keep momentum.` });
  if (consistency < 0.3 && opts.windowDays >= 14)
    insights.push({ kind: "risk", message: `Only ${activeDays} active days in ${opts.windowDays} — consistency is low.` });
  if (revisionEffectiveness.successRate > 0.6 && revisionEffectiveness.sessionsWithRevisits >= 3)
    insights.push({
      kind: "win",
      message: `Revision sessions improve recall ${Math.round(revisionEffectiveness.avgGain * 100)}% on average.`,
    });
  if (clusters[0])
    insights.push({ kind: "info", message: `Dominant weakness: "${clusters[0].tag}" across ${clusters[0].count} concepts.` });
  if (behavior.fatigue > 0.6)
    insights.push({ kind: "risk", message: `Fatigue signal high — shorter sessions may help.` });

  const recommendations = sequence.slice(0, 4).map((s) => ({
    microConceptId: s.microConceptId,
    title: s.title,
    priority: s.priority,
    reason: s.reasons[0] ?? "Recommended next step",
    estimatedMinutes: s.estimatedMinutes,
  }));

  return {
    summary,
    trend: buckets,
    bands,
    clusters,
    tagSeries,
    revisionEffectiveness,
    recallMA,
    predictions,
    upcomingReviews,
    behavior,
    sequence,
    recommendations,
    insights,
    generatedAt: new Date().toISOString(),
  };
}

const ParamsSchema = z
  .object({
    studentId: z.string().uuid().optional(),
    windowDays: z.number().int().min(7).max(120).optional(),
    granularity: z.enum(["day", "week"]).optional(),
    narrate: z.boolean().optional(),
  })
  .optional();

export const getIntelligenceAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ParamsSchema.parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data?.studentId ?? userId;
    const windowDays = data?.windowDays ?? 30;
    const granularity: Granularity = data?.granularity ?? (windowDays > 21 ? "week" : "day");

    const result = await computeIntelligence(supabase, target, { windowDays, granularity });

    let narrative: string | null = null;
    if (data?.narrate) {
      try {
        const res = await aiCall<{ narrative: string }>(
          [
            {
              role: "system",
              content:
                "You write a 3-sentence learning intelligence summary for a K-12 student. JSON: { narrative }. Mention one win, one risk, one next step. No emojis.",
            },
            {
              role: "user",
              content: JSON.stringify({
                summary: result.summary,
                predictions: result.predictions,
                topClusters: result.clusters.slice(0, 3),
                topRecommendation: result.recommendations[0] ?? null,
              }),
            },
          ],
          {
            module: "learning-intelligence.narrative",
            userId,
            json: true,
            cacheTtlSeconds: 60 * 30,
          },
        );
        narrative = res.output.narrative;
      } catch {
        narrative = null;
      }
    }

    return { ...result, narrative };
  });

// ============================================================
// Parent intelligence report (linked-students only via RLS).
// ============================================================
export const getParentIntelligenceReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        studentId: z.string().uuid(),
        windowDays: z.number().int().min(7).max(90).optional(),
        narrate: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = await computeIntelligence(supabase, data.studentId, {
      windowDays: data.windowDays ?? 30,
      granularity: (data.windowDays ?? 30) > 21 ? "week" : "day",
    });

    const alerts: { level: "info" | "warn" | "critical"; message: string }[] = [];
    const s = result.summary;
    if (s.criticalRisk > 0)
      alerts.push({
        level: "critical",
        message: `${s.criticalRisk} concept${s.criticalRisk > 1 ? "s" : ""} at critical retention risk — review needed this week.`,
      });
    if (s.consistency < 0.3)
      alerts.push({ level: "warn", message: `Low study consistency (${Math.round(s.consistency * 100)}% of days active).` });
    if (result.predictions.masteryTrend < -0.05)
      alerts.push({ level: "warn", message: `Predicted mastery declining ${Math.round(-result.predictions.masteryTrend * 100)}%.` });
    if (s.streak >= 5)
      alerts.push({ level: "info", message: `Strong ${s.streak}-day study streak.` });
    if (result.predictions.masteryTrend > 0.05)
      alerts.push({ level: "info", message: `Mastery improving ${Math.round(result.predictions.masteryTrend * 100)}%.` });

    let parentNarrative: string | null = null;
    if (data.narrate) {
      try {
        const res = await aiCall<{ narrative: string }>(
          [
            {
              role: "system",
              content:
                "Write a 4-sentence parent-facing summary of a child's weekly learning intelligence. Warm, factual, action-oriented. Return JSON { narrative }. Mention strength, risk, one suggested action. No emojis.",
            },
            {
              role: "user",
              content: JSON.stringify({
                summary: s,
                predictions: result.predictions,
                topClusters: result.clusters.slice(0, 3),
                topRecommendation: result.recommendations[0] ?? null,
              }),
            },
          ],
          {
            module: "learning-intelligence.parent-narrative",
            userId,
            json: true,
            cacheTtlSeconds: 60 * 60 * 6,
          },
        );
        parentNarrative = res.output.narrative;
      } catch {
        parentNarrative = null;
      }
    }

    return { ...result, alerts, parentNarrative };
  });
