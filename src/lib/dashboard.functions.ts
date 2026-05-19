import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StudyPath = {
  summary?: string;
  focus_subjects?: string[];
  weekly_plan?: { day: string; subject: string; topic: string; minutes: number }[];
  first_week_goals?: string[];
  tips?: string[];
};

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    const [
      { data: rec },
      { data: attempts },
      { data: evals },
      { data: mastery },
      { data: subjects },
      { data: sessions },
    ] = await Promise.all([
      supabase
        .from("ai_recommendations")
        .select("payload, model, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("quiz_attempts")
        .select("score, total, submitted_at, quiz_id")
        .eq("student_id", userId)
        .gte("submitted_at", sinceISO)
        .order("submitted_at", { ascending: false })
        .limit(40),
      supabase
        .from("evaluation_attempts")
        .select("score, total, created_at")
        .eq("student_id", userId)
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("concept_mastery")
        .select("mastery, confidence, streak, last_practiced_at")
        .eq("student_id", userId)
        .order("last_practiced_at", { ascending: false })
        .limit(50),
      supabase.from("subjects").select("id, name, slug, icon").limit(8),
      supabase
        .from("learning_sessions")
        .select("state, mastery, last_event_at")
        .eq("student_id", userId)
        .order("last_event_at", { ascending: false })
        .limit(50),
    ]);

    const payload = (rec?.[0]?.payload ?? {}) as { prefs?: { study_minutes_per_day?: number; subjects?: string[] }; path?: StudyPath };
    const path: StudyPath = payload.path ?? {};
    const prefs = payload.prefs ?? {};
    const goalMinutes = prefs.study_minutes_per_day ?? 45;

    // Activity (per-day for last 14 days)
    const days: { date: string; minutes: number; score: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayAttempts = (attempts ?? []).filter((a) => a.submitted_at?.startsWith(key));
      const minutes = Math.min(180, dayAttempts.length * 8 + (i === 0 ? 0 : 0));
      const score = dayAttempts.length
        ? Math.round(
            (dayAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0) /
              Math.max(1, dayAttempts.reduce((s, a) => s + (Number(a.total) || 0), 0))) * 100,
          )
        : 0;
      days.push({ date: key, minutes, score });
    }

    // Streak — consecutive days with any attempt
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].minutes > 0) streak++;
      else break;
    }

    // Today's minutes
    const todayKey = today.toISOString().slice(0, 10);
    const todayMinutes = days.find((d) => d.date === todayKey)?.minutes ?? 0;

    // Averages
    const totalScore = (attempts ?? []).reduce((s, a) => s + (Number(a.score) || 0), 0);
    const totalMax = (attempts ?? []).reduce((s, a) => s + (Number(a.total) || 0), 0);
    const avgScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const masteryAvg = (mastery ?? []).length
      ? Math.round(
          ((mastery ?? []).reduce((s, m) => s + (Number(m.mastery) || 0), 0) / (mastery ?? []).length) * 100,
        )
      : 0;

    // Recent activity timeline (merge attempts + evals)
    const activity = [
      ...(attempts ?? []).map((a) => ({
        kind: "quiz" as const,
        when: a.submitted_at as string,
        label: `Quiz attempt`,
        detail: `${Number(a.score)} / ${Number(a.total)}`,
      })),
      ...(evals ?? []).map((e) => ({
        kind: "eval" as const,
        when: e.created_at as string,
        label: `Recall check`,
        detail: `${Number(e.score)} / ${Number(e.total)}`,
      })),
      ...(sessions ?? [])
        .filter((s) => s.state === "completed")
        .map((s) => ({
          kind: "lesson" as const,
          when: s.last_event_at as string,
          label: `Lesson completed`,
          detail: `${Math.round((Number(s.mastery) || 0) * 100)}% mastery`,
        })),
    ]
      .sort((a, b) => (a.when < b.when ? 1 : -1))
      .slice(0, 8);

    return {
      goalMinutes,
      todayMinutes,
      streak,
      avgScore,
      masteryAvg,
      activityDays: days,
      path,
      prefs,
      subjects: subjects ?? [],
      focusSubjects: path.focus_subjects ?? prefs.subjects ?? [],
      weeklyPlan: path.weekly_plan ?? [],
      goals: path.first_week_goals ?? [],
      tips: path.tips ?? [],
      activity,
      generatedAt: rec?.[0]?.created_at ?? null,
    };
  });
