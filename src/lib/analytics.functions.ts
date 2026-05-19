/**
 * Performance analytics — student, parent, admin.
 *
 * Aggregates progress, quiz/eval attempts, mastery, and learning sessions
 * into dashboard-ready payloads. RLS-safe via requireSupabaseAuth.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type DayBucket = { date: string; minutes: number; attempts: number; accuracy: number };

function emptyDays(n: number): DayBucket[] {
  const out: DayBucket[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), minutes: 0, attempts: 0, accuracy: 0 });
  }
  return out;
}

async function computeForStudent(supabase: any, studentId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const [
    { data: attempts },
    { data: evals },
    { data: mastery },
    { data: sessions },
    { data: weak },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("score, total, submitted_at, quiz_id, quizzes(subject_id, title, subjects(name))")
      .eq("student_id", studentId)
      .gte("submitted_at", sinceISO)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("evaluation_attempts")
      .select("score, total, created_at")
      .eq("student_id", studentId)
      .gte("created_at", sinceISO),
    supabase
      .from("concept_mastery")
      .select("mastery, confidence, streak, last_practiced_at, micro_concept_id, micro_concepts(title, estimated_minutes)")
      .eq("student_id", studentId),
    supabase
      .from("learning_sessions")
      .select("attempts, mastery, updated_at, micro_concept_id")
      .eq("student_id", studentId)
      .gte("updated_at", sinceISO),
    supabase
      .from("weakness_profile")
      .select("weakness_tags, confidence, notes, updated_at, micro_concept_id, micro_concepts(title)")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase.from("subjects").select("id, name, slug, icon").limit(20),
  ]);

  // Per-day buckets
  const buckets = emptyDays(days);
  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const a of attempts ?? []) {
    const key = (a.submitted_at as string)?.slice(0, 10);
    const i = idx.get(key);
    if (i === undefined) continue;
    buckets[i].attempts += 1;
    buckets[i].minutes += 8;
    buckets[i].accuracy += a.total ? Number(a.score) / Number(a.total) : 0;
  }
  for (const b of buckets) b.accuracy = b.attempts ? b.accuracy / b.attempts : 0;

  // Subject roll-up
  const bySubject = new Map<string, { name: string; attempts: number; score: number; total: number; minutes: number }>();
  for (const a of attempts ?? []) {
    const sid = (a as any).quizzes?.subject_id ?? "unspecified";
    const name = (a as any).quizzes?.subjects?.name ?? "Other";
    const row = bySubject.get(sid) ?? { name, attempts: 0, score: 0, total: 0, minutes: 0 };
    row.attempts += 1;
    row.score += Number(a.score) || 0;
    row.total += Number(a.total) || 0;
    row.minutes += 8;
    bySubject.set(sid, row);
  }
  const subjectStats = Array.from(bySubject.entries()).map(([id, r]) => ({
    id,
    name: r.name,
    attempts: r.attempts,
    minutes: r.minutes,
    accuracy: r.total ? r.score / r.total : 0,
  }));

  // KPIs
  const totalAttempts = (attempts ?? []).length;
  const totalScore = ((attempts ?? []) as any[]).reduce((s: number, a: any) => s + Number(a.score || 0), 0);
  const totalMax = ((attempts ?? []) as any[]).reduce((s: number, a: any) => s + Number(a.total || 0), 0);
  const accuracy = totalMax ? totalScore / totalMax : 0;
  const totalMinutes = buckets.reduce((s, b) => s + b.minutes, 0);
  const masteryAvg = (mastery ?? []).length
    ? (mastery ?? []).reduce((s: number, m: any) => s + Number(m.mastery || 0), 0) / (mastery ?? []).length
    : 0;
  const evalAvg = (evals ?? []).length
    ? (evals ?? []).reduce((s: number, e: any) => s + (e.total ? Number(e.score) / Number(e.total) : 0), 0) /
      (evals ?? []).length
    : 0;

  // Improvement trend: compare first half vs second half accuracy
  const half = Math.floor(buckets.length / 2);
  const firstHalf = buckets.slice(0, half).filter((b) => b.attempts);
  const secondHalf = buckets.slice(half).filter((b) => b.attempts);
  const trendDelta =
    (secondHalf.length ? secondHalf.reduce((s, b) => s + b.accuracy, 0) / secondHalf.length : 0) -
    (firstHalf.length ? firstHalf.reduce((s, b) => s + b.accuracy, 0) / firstHalf.length : 0);

  // Streak (any activity)
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].attempts > 0) streak++;
    else break;
  }

  // Weak areas
  const weakAreas = [
    ...((mastery ?? []) as any[])
      .filter((m) => Number(m.mastery) < 0.5)
      .sort((a, b) => Number(a.mastery) - Number(b.mastery))
      .slice(0, 6)
      .map((m) => ({
        title: m.micro_concepts?.title ?? "Concept",
        mastery: Number(m.mastery),
        kind: "mastery" as const,
      })),
  ];
  const weaknessTags = new Map<string, number>();
  for (const w of weak ?? []) {
    for (const tag of (w.weakness_tags ?? []) as string[]) {
      weaknessTags.set(tag, (weaknessTags.get(tag) ?? 0) + 1);
    }
  }
  const tagClusters = Array.from(weaknessTags.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    kpis: {
      totalAttempts,
      accuracy,
      totalMinutes,
      masteryAvg,
      evalAvg,
      trendDelta,
      streak,
      conceptsTracked: (mastery ?? []).length,
      sessionsActive: (sessions ?? []).length,
    },
    timeline: buckets,
    subjectStats,
    weakAreas,
    tagClusters,
    subjects: subjects ?? [],
  };
}

export const getMyAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return computeForStudent(context.supabase, context.userId, 30);
  });

export const getChildAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ studentId: z.string().uuid() }).parse)
  .handler(async ({ context, data }) => {
    // RLS via is_linked_parent ensures only linked parents can see this data.
    const result = await computeForStudent(context.supabase, data.studentId, 30);

    // Generate monthly report (simple aggregate) + alerts
    const { kpis, timeline, subjectStats, weakAreas } = result;
    const alerts: { level: "info" | "warn" | "critical"; message: string }[] = [];
    if (kpis.accuracy < 0.4 && kpis.totalAttempts > 3)
      alerts.push({ level: "critical", message: `Accuracy is ${(kpis.accuracy * 100).toFixed(0)}% — needs attention.` });
    if (kpis.trendDelta < -0.05)
      alerts.push({ level: "warn", message: `Performance dipped ${Math.round(kpis.trendDelta * -100)}% over the period.` });
    if (kpis.streak === 0)
      alerts.push({ level: "warn", message: "No study activity in the last few days." });
    if (kpis.trendDelta > 0.05)
      alerts.push({ level: "info", message: `Improving trend: +${Math.round(kpis.trendDelta * 100)}% accuracy.` });
    const weakSubject = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (weakSubject && weakSubject.attempts >= 2 && weakSubject.accuracy < 0.5)
      alerts.push({ level: "warn", message: `${weakSubject.name} accuracy at ${(weakSubject.accuracy * 100).toFixed(0)}%.` });

    return { ...result, alerts, monthly: { timeline, subjectStats, weakAreas } };
  });

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    const [
      { count: usersCount },
      { count: studentsCount },
      { count: attemptsCount },
      { count: sessionsCount },
      { count: chatCount },
      { data: attempts },
      { data: sessions },
      { data: mastery },
      { data: subjects },
    ] = await Promise.all([
      supabase.from("profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).gte("submitted_at", sinceISO),
      supabase.from("learning_sessions").select("id", { count: "exact", head: true }).gte("updated_at", sinceISO),
      supabase.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
      supabase
        .from("quiz_attempts")
        .select("score, total, submitted_at, student_id, quizzes(subject_id, subjects(name))")
        .gte("submitted_at", sinceISO)
        .limit(2000),
      supabase
        .from("learning_sessions")
        .select("state, mastery, attempts, updated_at")
        .gte("updated_at", sinceISO)
        .limit(2000),
      supabase.from("concept_mastery").select("mastery, student_id").limit(5000),
      supabase.from("subjects").select("id, name").limit(50),
    ]);

    // Engagement timeline (last 12 weeks)
    const weeks: { week: string; attempts: number; activeStudents: number }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7 - 6);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const label = `W${12 - i}`;
      const inRange = (attempts ?? []).filter((a: any) => {
        const t = new Date(a.submitted_at).getTime();
        return t >= start.getTime() && t <= end.getTime() + 86_400_000;
      });
      const active = new Set(inRange.map((a: any) => a.student_id)).size;
      weeks.push({ week: label, attempts: inRange.length, activeStudents: active });
    }

    // Subject effectiveness: avg accuracy by subject
    const bySubject = new Map<string, { name: string; score: number; total: number; attempts: number }>();
    for (const a of attempts ?? []) {
      const sid = (a as any).quizzes?.subject_id ?? "unspecified";
      const name = (a as any).quizzes?.subjects?.name ?? "Other";
      const r = bySubject.get(sid) ?? { name, score: 0, total: 0, attempts: 0 };
      r.score += Number(a.score) || 0;
      r.total += Number(a.total) || 0;
      r.attempts += 1;
      bySubject.set(sid, r);
    }
    const subjectEffectiveness = Array.from(bySubject.values())
      .map((r) => ({ name: r.name, accuracy: r.total ? r.score / r.total : 0, attempts: r.attempts }))
      .sort((a, b) => b.attempts - a.attempts);

    // Mastery distribution across platform
    const bands = { mastered: 0, proficient: 0, developing: 0, weak: 0 };
    for (const m of mastery ?? []) {
      const v = Number(m.mastery);
      if (v >= 0.85) bands.mastered++;
      else if (v >= 0.6) bands.proficient++;
      else if (v >= 0.35) bands.developing++;
      else bands.weak++;
    }

    // Learning effectiveness
    const completedSessions = (sessions ?? []).filter((s: any) => s.state === "completed").length;
    const totalSessions = (sessions ?? []).length;
    const completionRate = totalSessions ? completedSessions / totalSessions : 0;
    const avgPlatformMastery = (mastery ?? []).length
      ? (mastery ?? []).reduce((s: number, m: any) => s + Number(m.mastery), 0) / (mastery ?? []).length
      : 0;

    return {
      kpis: {
        users: usersCount ?? 0,
        students: studentsCount ?? 0,
        attempts30d: attemptsCount ?? 0,
        sessions30d: sessionsCount ?? 0,
        chatMessages30d: chatCount ?? 0,
        completionRate,
        avgPlatformMastery,
        subjectsCount: (subjects ?? []).length,
      },
      weeks,
      subjectEffectiveness,
      bands,
    };
  });
