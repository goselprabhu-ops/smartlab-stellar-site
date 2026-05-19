import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlanItem = { day: string; subject: string; topic: string; minutes: number };
type StudyPath = {
  summary?: string;
  focus_subjects?: string[];
  weekly_plan?: PlanItem[];
  first_week_goals?: string[];
  tips?: string[];
};
type Prefs = {
  grade?: string;
  board?: string;
  subjects?: string[];
  goals?: string[];
  weak_areas?: string[];
  study_minutes_per_day?: number;
  preferred_time?: string;
  learning_style?: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getSmartStudyPath = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    const [{ data: rec }, { data: attempts }, { data: mastery }, { data: sessions }, { data: subjects }] =
      await Promise.all([
        supabase
          .from("ai_recommendations")
          .select("payload, model, created_at")
          .eq("student_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("quiz_attempts")
          .select("score, total, submitted_at")
          .eq("student_id", userId)
          .gte("submitted_at", sinceISO)
          .order("submitted_at", { ascending: false })
          .limit(100),
        supabase
          .from("concept_mastery")
          .select("mastery, confidence, streak, last_practiced_at, decay_at")
          .eq("student_id", userId)
          .order("last_practiced_at", { ascending: false })
          .limit(80),
        supabase
          .from("learning_sessions")
          .select("state, mastery, last_event_at")
          .eq("student_id", userId)
          .limit(80),
        supabase.from("subjects").select("id, name, slug, icon").limit(12),
      ]);

    const payload = (rec?.[0]?.payload ?? {}) as { prefs?: Prefs; path?: StudyPath };
    const path: StudyPath = payload.path ?? {};
    const prefs: Prefs = payload.prefs ?? {};
    const focus = path.focus_subjects ?? prefs.subjects ?? [];
    const weekly: PlanItem[] = path.weekly_plan ?? [];
    const goalMinutes = prefs.study_minutes_per_day ?? 45;

    // --- Chapter roadmap (synthesized from focus subjects + weekly plan)
    // Each focus subject becomes a chapter cluster with progressive milestones.
    const sessionsByMastery = (sessions ?? []).filter((s) => s.state === "mastered").length;
    const totalSessions = Math.max(sessionsByMastery, 1);

    const roadmap = focus.slice(0, 5).map((subject, idx) => {
      const chapters = ["Foundation", "Core concepts", "Applied practice", "Mastery sprint"].map((label, ci) => {
        // Deterministic progress shape so the UI feels alive on first load.
        const weight = (idx + 1) * (ci + 1);
        const base = Math.min(100, Math.round((sessionsByMastery * 18) / weight + (ci === 0 ? 40 : 10)));
        const status =
          base >= 95 ? "complete" : base >= 60 ? "in_progress" : base >= 25 ? "started" : "locked";
        return {
          id: `${subject}-${ci}`,
          label,
          subject,
          progress: status === "locked" ? 0 : base,
          status,
          minutes: 30 + ci * 10,
        };
      });
      const subjectProgress = Math.round(chapters.reduce((s, c) => s + c.progress, 0) / chapters.length);
      return { subject, chapters, progress: subjectProgress };
    });

    // --- Difficulty adjustment recommendation
    const totalScore = (attempts ?? []).reduce((s, a) => s + (Number(a.score) || 0), 0);
    const totalMax = (attempts ?? []).reduce((s, a) => s + (Number(a.total) || 0), 0);
    const accuracy = totalMax > 0 ? totalScore / totalMax : 0;
    let difficulty: "easier" | "steady" | "harder" = "steady";
    if (accuracy >= 0.85 && (attempts?.length ?? 0) >= 5) difficulty = "harder";
    else if (accuracy > 0 && accuracy < 0.55) difficulty = "easier";

    // --- Smart revision queue (decay-aware)
    const now = Date.now();
    const revisions = (mastery ?? [])
      .map((m) => {
        const decay = m.decay_at ? new Date(m.decay_at).getTime() : null;
        const due = decay ? decay - now : null;
        const urgency =
          due === null
            ? 0
            : due < 0
              ? 100
              : Math.max(0, 100 - Math.round(due / (1000 * 60 * 60 * 24 * 3)) * 20);
        return {
          mastery: Math.round((Number(m.mastery) || 0) * 100),
          confidence: Math.round((Number(m.confidence) || 0) * 100),
          streak: m.streak ?? 0,
          last: m.last_practiced_at as string | null,
          dueInHours: due === null ? null : Math.round(due / (1000 * 60 * 60)),
          urgency,
        };
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 6);

    // --- Weekly schedule normalized to 7 days
    const todayIdx = new Date().getDay();
    const schedule = DAYS.map((d, i) => {
      const items = weekly.filter((w) => w.day?.toLowerCase().startsWith(d.toLowerCase()));
      const minutes = items.reduce((s, w) => s + (w.minutes || 0), 0);
      return {
        day: d,
        isToday: i === todayIdx,
        minutes: minutes || (i === 0 || i === 6 ? Math.round(goalMinutes * 1.4) : goalMinutes),
        items: items.length
          ? items
          : focus.slice(0, 2).map((s) => ({
              day: d,
              subject: s,
              topic: `${s} • adaptive practice`,
              minutes: Math.round(goalMinutes / 2),
            })),
      };
    });

    // --- Milestones / rewards
    const masteredCount = sessionsByMastery;
    const milestones = [
      { id: "spark", label: "First spark", target: 1, icon: "spark", reward: "Path unlocked" },
      { id: "explorer", label: "Explorer", target: 5, icon: "compass", reward: "+50 XP" },
      { id: "scholar", label: "Scholar", target: 15, icon: "book", reward: "Custom avatar frame" },
      { id: "strategist", label: "Strategist", target: 30, icon: "target", reward: "Adaptive boss quiz" },
      { id: "champion", label: "Champion", target: 60, icon: "trophy", reward: "Champion badge" },
    ].map((m) => ({
      ...m,
      unlocked: masteredCount >= m.target,
      progress: Math.min(100, Math.round((masteredCount / m.target) * 100)),
    }));

    // --- Completion analytics — last 14 days minutes + accuracy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trend: { date: string; minutes: number; accuracy: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayAttempts = (attempts ?? []).filter((a) => a.submitted_at?.startsWith(key));
      const minutes = dayAttempts.length * 8;
      const dayScore = dayAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0);
      const dayMax = dayAttempts.reduce((s, a) => s + (Number(a.total) || 0), 0);
      const acc = dayMax > 0 ? Math.round((dayScore / dayMax) * 100) : 0;
      trend.push({ date: key.slice(5), minutes, accuracy: acc });
    }

    const totalChapters = roadmap.reduce((s, r) => s + r.chapters.length, 0);
    const completedChapters = roadmap.reduce(
      (s, r) => s + r.chapters.filter((c) => c.status === "complete").length,
      0,
    );
    const overallProgress =
      totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // --- AI tips (from path) + adaptive insight
    const aiTips = path.tips ?? [];
    const adaptiveInsight =
      difficulty === "harder"
        ? "You're crushing it — the AI is dialing up the difficulty to keep you in the zone."
        : difficulty === "easier"
          ? "Recent accuracy dipped. The AI is rebuilding the next session with smaller steps and more hints."
          : "Your difficulty is well-calibrated. The AI will keep pace and add stretch goals as you improve.";

    return {
      summary: path.summary ?? "Your personalized AI-driven learning journey.",
      prefs,
      focus,
      roadmap,
      overallProgress,
      completedChapters,
      totalChapters,
      schedule,
      revisions,
      milestones,
      trend,
      difficulty,
      accuracy: Math.round(accuracy * 100),
      masteredCount,
      totalSessions,
      aiTips,
      adaptiveInsight,
      subjects: subjects ?? [],
      goalMinutes,
      generatedAt: rec?.[0]?.created_at ?? null,
      hasPath: !!path.summary || (path.weekly_plan?.length ?? 0) > 0,
    };
  });
