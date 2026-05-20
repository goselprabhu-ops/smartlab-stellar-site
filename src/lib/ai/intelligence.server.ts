/**
 * AI Learning Intelligence (v1.0)
 *
 * Pure server-only engine that turns raw signals (recalls, evals, mastery,
 * relations, behavior) into:
 *   - confidence prediction        (how sure is the student, 0..1)
 *   - retention prediction         (R at t=1d / 7d / 30d, decay-aware)
 *   - weakness clusters            (dominant tag groups across history)
 *   - dependency score             (how blocking is this concept)
 *   - personalized sequence        (next-best ordered queue with reasons)
 *   - behavior signals             (consistency, depth, fatigue)
 *
 * Designed to be deterministic + cheap by default; AI is opt-in for narration.
 * No DB writes — callers persist what they need.
 */

const MS_PER_DAY = 86_400_000;
const TARGET_RETRIEVABILITY = 0.9;

// =============================================================
// Types
// =============================================================
export type RecallSignal = {
  score: number; // 0..1
  feedback?: { missedPoints?: string[]; misconceptions?: string[] } | null;
  createdAt: string;
};

export type EvalSignal = {
  score: number;
  total: number;
  perQuestion?: Array<{ correct: boolean; subSkill?: string }>;
  createdAt: string;
};

export type MasteryRow = {
  microConceptId: string;
  title?: string;
  conceptId?: string | null;
  difficulty?: number;
  estimatedMinutes?: number;
  tags?: string[];
  prerequisiteIds?: string[];
  mastery: number;
  confidence: number;
  streak: number;
  lastPracticedAt: string | null;
  decayAt: string | null;
};

export type RelationEdge = {
  source: string;
  target: string;
  relation: string; // prerequisite | related | applies_to | leads_to ...
  weight: number;
};

export type WeaknessRow = {
  microConceptId: string;
  tags: string[];
  confidence: number;
  notes?: string | null;
  updatedAt?: string | null;
};

// =============================================================
// Memory + retention math (Ebbinghaus + streak/confidence boosts)
// =============================================================
export function stabilityDays(row: MasteryRow, recentRecallAvg: number | null): number {
  const m = clamp(row.mastery);
  const c = clamp(row.confidence);
  const streak = Math.max(0, row.streak || 0);
  const masteryBoost = 0.5 + m;            // 0.5 .. 1.5
  const streakBoost = Math.sqrt(1 + streak);
  const confidenceBoost = 0.75 + c * 0.5;  // 0.75 .. 1.25
  const recallBoost = recentRecallAvg == null ? 1 : 0.7 + clamp(recentRecallAvg) * 0.6;
  // Difficulty erodes stability slightly.
  const difficultyPenalty = 1 - Math.min(0.35, ((row.difficulty ?? 1) - 1) * 0.08);
  return Math.max(0.25, masteryBoost * streakBoost * confidenceBoost * recallBoost * difficultyPenalty);
}

export function retrievabilityAt(row: MasteryRow, daysFromNow: number, recentRecallAvg: number | null): number {
  const last = row.lastPracticedAt ? new Date(row.lastPracticedAt).getTime() : null;
  const elapsedDays = last ? Math.max(0, (Date.now() - last) / MS_PER_DAY) : 9999;
  const s = stabilityDays(row, recentRecallAvg);
  return Math.exp(-(elapsedDays + daysFromNow) / s);
}

export function nextReviewDays(row: MasteryRow, recentRecallAvg: number | null): number {
  return stabilityDays(row, recentRecallAvg) * Math.log(1 / TARGET_RETRIEVABILITY);
}

// =============================================================
// Confidence prediction
// =============================================================
/**
 * Predicts student confidence on a micro-concept by blending stored confidence,
 * recent recall accuracy, eval consistency, and streak. Includes a calibration
 * penalty when the student is over-confident relative to performance.
 */
export function predictConfidence(args: {
  row: MasteryRow;
  recentRecalls: RecallSignal[];
  recentEvals: EvalSignal[];
}): { confidence: number; calibrationGap: number; trend: "up" | "flat" | "down" } {
  const { row, recentRecalls, recentEvals } = args;
  const stored = clamp(row.confidence);
  const recallAvg = average(recentRecalls.map((r) => r.score));
  const evalAvg = average(
    recentEvals.map((e) => (e.total > 0 ? e.score / e.total : 0)),
  );
  const performance = (recallAvg * 0.45 + evalAvg * 0.45 + clamp(row.mastery) * 0.10);

  const streakBoost = Math.min(0.15, Math.max(0, row.streak || 0) * 0.03);
  // Predicted = blend stored confidence with measured performance, then nudge by streak.
  const blended = clamp(0.35 * stored + 0.55 * performance + 0.10 * Math.tanh(streakBoost * 10));
  // Penalize over-confidence (stored >> performance).
  const calibrationGap = stored - performance; // >0 means over-confident
  const calibrated = calibrationGap > 0.2 ? blended - 0.1 : blended;

  const trend = recallTrend(recentRecalls);

  return { confidence: clamp(calibrated), calibrationGap, trend };
}

function recallTrend(recalls: RecallSignal[]): "up" | "flat" | "down" {
  if (recalls.length < 2) return "flat";
  const sorted = [...recalls].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const half = Math.max(1, Math.floor(sorted.length / 2));
  const before = average(sorted.slice(0, half).map((r) => r.score));
  const after = average(sorted.slice(half).map((r) => r.score));
  const delta = after - before;
  if (delta > 0.07) return "up";
  if (delta < -0.07) return "down";
  return "flat";
}

// =============================================================
// Retention prediction
// =============================================================
export function predictRetention(args: {
  row: MasteryRow;
  recentRecalls: RecallSignal[];
}): {
  r1d: number;
  r7d: number;
  r30d: number;
  forgetIn7d: number;
  riskScore: number;          // 0..1, blended retention risk
  recommendedReviewAt: string; // ISO
} {
  const recallAvg = average(args.recentRecalls.map((r) => r.score));
  const r1d = retrievabilityAt(args.row, 1, recallAvg || null);
  const r7d = retrievabilityAt(args.row, 7, recallAvg || null);
  const r30d = retrievabilityAt(args.row, 30, recallAvg || null);
  const forgetIn7d = 1 - r7d;
  // Risk = blended forget probability + low confidence/mastery + difficulty.
  const riskScore = clamp(
    0.55 * forgetIn7d +
      0.20 * (1 - clamp(args.row.confidence)) +
      0.15 * (1 - clamp(args.row.mastery)) +
      0.10 * Math.min(1, ((args.row.difficulty ?? 1) - 1) / 3),
  );
  const nextDays = nextReviewDays(args.row, recallAvg || null);
  const last = args.row.lastPracticedAt ? new Date(args.row.lastPracticedAt).getTime() : Date.now();
  return {
    r1d,
    r7d,
    r30d,
    forgetIn7d,
    riskScore,
    recommendedReviewAt: new Date(last + nextDays * MS_PER_DAY).toISOString(),
  };
}

// =============================================================
// Weakness detection & clustering
// =============================================================
export type WeaknessCluster = {
  tag: string;
  count: number;
  microConceptIds: string[];
  avgConfidence: number;
  severity: number; // 0..1
};

/**
 * Cluster weakness tags across the student's history and rank by severity.
 * Severity = frequency × inverse confidence × recency boost.
 */
export function clusterWeaknesses(
  weaknesses: WeaknessRow[],
): WeaknessCluster[] {
  const now = Date.now();
  const map = new Map<string, { count: number; ids: Set<string>; conf: number[]; recencyBoost: number[] }>();
  for (const w of weaknesses) {
    const tags = (w.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
    const ageDays = w.updatedAt ? Math.max(0, (now - new Date(w.updatedAt).getTime()) / MS_PER_DAY) : 999;
    const recency = Math.exp(-ageDays / 14); // half-life ~10 days
    for (const tag of tags) {
      const entry = map.get(tag) ?? { count: 0, ids: new Set<string>(), conf: [], recencyBoost: [] };
      entry.count += 1;
      entry.ids.add(w.microConceptId);
      entry.conf.push(clamp(w.confidence));
      entry.recencyBoost.push(recency);
      map.set(tag, entry);
    }
  }
  const clusters: WeaknessCluster[] = [];
  for (const [tag, entry] of map.entries()) {
    const avgConf = average(entry.conf);
    const recency = average(entry.recencyBoost);
    const severity = clamp(0.45 * Math.tanh(entry.count / 3) + 0.40 * (1 - avgConf) + 0.15 * recency);
    clusters.push({
      tag,
      count: entry.count,
      microConceptIds: Array.from(entry.ids),
      avgConfidence: avgConf,
      severity,
    });
  }
  return clusters.sort((a, b) => b.severity - a.severity);
}

/**
 * Misconception extraction from recall feedback — surfaces specific recurring
 * misunderstandings beyond the coarse tag clusters.
 */
export function extractMisconceptions(recalls: RecallSignal[]): { text: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of recalls) {
    const items = [...(r.feedback?.misconceptions ?? []), ...(r.feedback?.missedPoints ?? [])];
    for (const raw of items) {
      const key = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

// =============================================================
// Concept dependency intelligence
// =============================================================
/**
 * Score each micro-concept by how "blocking" it is in the graph:
 * downstream reach × edge weights, propagated 2 hops. High score = unlocking
 * this concept opens the most future learning.
 */
export function dependencyScores(
  microConceptIds: string[],
  edges: RelationEdge[],
): Map<string, number> {
  const out = new Map<string, number>();
  const adj = new Map<string, RelationEdge[]>();
  for (const id of microConceptIds) {
    adj.set(id, []);
    out.set(id, 0);
  }
  for (const e of edges) {
    if (!adj.has(e.source)) continue;
    if (!adj.has(e.target)) continue;
    adj.get(e.source)!.push(e);
  }
  // 2-hop weighted reach, with relation-type multipliers.
  const relWeight = (rel: string) => {
    switch (rel) {
      case "prerequisite":
        return 1.2;
      case "leads_to":
        return 1.0;
      case "applies_to":
        return 0.7;
      case "related":
        return 0.4;
      default:
        return 0.5;
    }
  };
  for (const id of microConceptIds) {
    let reach = 0;
    const hop1 = adj.get(id) ?? [];
    for (const e1 of hop1) {
      reach += e1.weight * relWeight(e1.relation);
      const hop2 = adj.get(e1.target) ?? [];
      for (const e2 of hop2) {
        reach += 0.5 * e2.weight * relWeight(e2.relation);
      }
    }
    out.set(id, reach);
  }
  // Normalize to 0..1
  const max = Math.max(0.0001, ...Array.from(out.values()));
  for (const [k, v] of out) out.set(k, v / max);
  return out;
}

// =============================================================
// Personalized sequencing
// =============================================================
export type SequenceItem = {
  microConceptId: string;
  title: string;
  priority: number;     // 0..1 (higher = sooner)
  reason: string;
  factors: {
    forgetting: number;
    weakness: number;
    dependency: number;
    prerequisitesMet: number;
    difficultyFit: number;
  };
  recommendedMinutes: number;
};

export function personalizedSequence(args: {
  rows: MasteryRow[];
  recentRecalls: RecallSignal[];
  weaknesses: WeaknessRow[];
  edges: RelationEdge[];
  preferredMinutes?: number;
  topK?: number;
}): SequenceItem[] {
  const recallAvg = average(args.recentRecalls.map((r) => r.score)) || null;
  const masteredIds = new Set(
    args.rows.filter((r) => r.mastery >= 0.85).map((r) => r.microConceptId),
  );
  const weaknessByConcept = new Map<string, number>();
  for (const w of args.weaknesses) {
    const sev = w.tags.length * (1 - clamp(w.confidence));
    weaknessByConcept.set(w.microConceptId, sev);
  }
  const depScores = dependencyScores(
    args.rows.map((r) => r.microConceptId),
    args.edges,
  );

  const topK = args.topK ?? 8;
  const items: SequenceItem[] = args.rows.map((row) => {
    const pr = predictRetention({ row, recentRecalls: args.recentRecalls });
    const forgetting = pr.riskScore;
    const weakness = Math.min(1, (weaknessByConcept.get(row.microConceptId) ?? 0) / 3);
    const dependency = depScores.get(row.microConceptId) ?? 0;
    const prereqs = row.prerequisiteIds ?? [];
    const prerequisitesMet = prereqs.length
      ? prereqs.filter((p) => masteredIds.has(p)).length / prereqs.length
      : 1;
    // Difficulty fit: prefer items near (mastery+0.1) so the loop stays in flow.
    const diffNorm = Math.min(1, Math.max(0, ((row.difficulty ?? 1) - 1) / 4));
    const ideal = clamp(row.mastery) + 0.1;
    const difficultyFit = 1 - Math.min(1, Math.abs(diffNorm - ideal));

    const priority = clamp(
      0.38 * forgetting +
        0.22 * weakness +
        0.20 * dependency +
        0.12 * prerequisitesMet +
        0.08 * difficultyFit,
    );

    const reasonBits: string[] = [];
    if (forgetting > 0.5) reasonBits.push("high forget risk");
    if (weakness > 0.4) reasonBits.push("active weakness cluster");
    if (dependency > 0.6) reasonBits.push("unlocks downstream concepts");
    if (prerequisitesMet < 1) reasonBits.push("prerequisites still in progress");
    if (difficultyFit > 0.8) reasonBits.push("fits current difficulty");
    if (!reasonBits.length) reasonBits.push("steady spaced review");

    return {
      microConceptId: row.microConceptId,
      title: row.title ?? "Micro-concept",
      priority,
      reason: reasonBits.join("; "),
      factors: { forgetting, weakness, dependency, prerequisitesMet, difficultyFit },
      recommendedMinutes: Math.max(5, Math.min(20, row.estimatedMinutes ?? 8)),
    };
  });

  // Honor a daily budget if provided.
  const sorted = items.sort((a, b) => b.priority - a.priority);
  if (!args.preferredMinutes) return sorted.slice(0, topK);
  const out: SequenceItem[] = [];
  let used = 0;
  for (const it of sorted) {
    if (out.length >= topK) break;
    if (used + it.recommendedMinutes > args.preferredMinutes) continue;
    out.push(it);
    used += it.recommendedMinutes;
  }
  return out.length ? out : sorted.slice(0, topK);
}

// =============================================================
// Behavior intelligence
// =============================================================
export function behaviorSignals(args: {
  recalls: RecallSignal[];
  evals: EvalSignal[];
}): {
  consistency: number;  // 0..1 (active-days share over the last 14 days)
  depth: number;        // 0..1 (avg attempts per active day, capped)
  fatigueRisk: number;  // 0..1 (declining accuracy + high volume)
  activeDays: number;
} {
  const horizon = 14;
  const today = startOfDay(new Date());
  const dayKeys = Array.from({ length: horizon }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (horizon - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  const scoresByDay = new Map<string, number[]>();

  const push = (createdAt: string, score: number | null) => {
    const key = createdAt.slice(0, 10);
    if (!counts.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (score != null) {
      const arr = scoresByDay.get(key) ?? [];
      arr.push(score);
      scoresByDay.set(key, arr);
    }
  };

  for (const r of args.recalls) push(r.createdAt, r.score);
  for (const e of args.evals) push(e.createdAt, e.total > 0 ? e.score / e.total : null);

  const activeDays = Array.from(counts.values()).filter((c) => c > 0).length;
  const totalEvents = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const consistency = activeDays / horizon;
  const depth = Math.min(1, totalEvents / (Math.max(1, activeDays) * 4));

  // Fatigue: last 3 days accuracy vs prior 7, when volume is high.
  const recent: number[] = [];
  const prior: number[] = [];
  for (let i = 0; i < dayKeys.length; i++) {
    const key = dayKeys[i];
    const arr = scoresByDay.get(key) ?? [];
    if (i >= dayKeys.length - 3) recent.push(...arr);
    else prior.push(...arr);
  }
  const r = average(recent);
  const p = average(prior);
  const drop = Math.max(0, p - r);
  const volume = Math.min(1, totalEvents / 30);
  const fatigueRisk = clamp(drop * 1.5 * volume);

  return { consistency, depth, fatigueRisk, activeDays };
}

// =============================================================
// Helpers
// =============================================================
function clamp(n: number, lo = 0, hi = 1): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function average(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}
