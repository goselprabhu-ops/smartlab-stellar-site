/**
 * Gamification engine — server functions.
 *
 * Public API:
 *  - getEngagementProfile  → full hub payload for the student
 *  - awardXp               → record an XP event + sync streak/level/goal/achievements
 *  - checkInStreak         → idempotent daily check-in (no XP)
 *  - getLeaderboard        → ranked table for class/grade/global × day/week/month/all
 *  - generateChallenges    → AI-suggested smart missions (writes to DB)
 *  - completeChallenge     → mark progress / claim XP
 *  - listAchievements      → catalog + which the student has unlocked
 *
 * All RLS-safe via requireSupabaseAuth.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  burnoutScore,
  levelFromXp,
  motivationCopy,
  pickMotivationTone,
  suggestChallenges,
  suggestDailyGoalMinutes,
  type EngagementSignals,
} from "./ai/gamification.server";

const DAY = 86_400_000;

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

// (intentionally untyped: supabase generated types tighten jsonb to never-style unions
// which fights insert/update on dynamic shapes — use `any` locally.)


function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((da - db) / DAY);
}

async function ensureEngagementRow(
  supabase: any,
  studentId: string,
): Promise<any> {
  const { data: existing } = await supabase
    .from("student_engagement")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabase
    .from("student_engagement")
    .insert({ student_id: studentId })
    .select("*")
    .single();
  return created;
}

async function loadSignals(
  supabase: any,
  studentId: string,
  row: any,
): Promise<EngagementSignals> {
  const since = new Date(Date.now() - 14 * DAY).toISOString();

  const [{ data: xp }, { data: recall }, { data: weakness }] = await Promise.all([
    supabase
      .from("xp_events")
      .select("created_at, metadata, kind")
      .eq("student_id", studentId)
      .gte("created_at", since),
    supabase
      .from("recollection_attempts")
      .select("ai_score, created_at")
      .eq("student_id", studentId)
      .gte("created_at", since),
    supabase
      .from("weakness_profile")
      .select("micro_concept_id, confidence")
      .eq("student_id", studentId),
  ]);

  const activeDates = new Set<string>();
  let minutesTotal = 0;
  for (const e of xp ?? []) {
    activeDates.add(String(e.created_at).slice(0, 10));
    const m = Number((e.metadata as any)?.minutes ?? 0);
    if (e.kind === "study" && Number.isFinite(m)) minutesTotal += m;
  }
  const days = Math.max(1, activeDates.size);
  const avgMinutes = Math.round(minutesTotal / days);

  const recallScores = (recall ?? [])
    .map((r: any) => Number(r.ai_score))
    .filter((n: number) => Number.isFinite(n));
  const avgRecall =
    recallScores.length > 0
      ? recallScores.reduce((s: number, n: number) => s + n, 0) / recallScores.length
      : 0;

  // Use last quiz_score events as accuracy proxy when present
  const accScores = (xp ?? [])
    .filter((e: any) => e.kind === "quiz")
    .map((e: any) => Number((e.metadata as any)?.accuracy ?? 0))
    .filter((n: number) => n > 0);
  const avgAccuracy =
    accScores.length > 0
      ? accScores.reduce((s: number, n: number) => s + n, 0) / accScores.length
      : avgRecall;

  const weakCount = (weakness ?? []).filter(
    (w: any) => Number(w.confidence ?? 0) < 0.5,
  ).length;

  return {
    totalXp: row.total_xp ?? 0,
    level: row.level ?? 1,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastActiveDate: row.last_active_date ?? null,
    daysActiveLast14: activeDates.size,
    avgMinutesPerActiveDay: avgMinutes,
    recentAccuracy: avgAccuracy,
    recentRecall: avgRecall,
    weakTagsCount: weakCount,
    motivationProfile: (row.motivation_profile ?? "balanced") as any,
  };
}

async function syncStreakOnActivity(
  supabase: any,
  studentId: string,
  row: any,
): Promise<{ current: number; longest: number; freezeUsed: boolean }> {
  const today = todayISO();
  const last = row.last_active_date as string | null;

  let current = row.current_streak ?? 0;
  let longest = row.longest_streak ?? 0;
  let freezeUsed = false;

  if (!last) {
    current = 1;
  } else if (last === today) {
    // already counted today
  } else {
    const gap = diffDays(today, last);
    if (gap === 1) {
      current += 1;
    } else if (gap === 2 && (row.freeze_credits ?? 0) > 0) {
      // burn 1 freeze to preserve streak
      current += 1;
      freezeUsed = true;
    } else {
      current = 1;
    }
  }

  if (current > longest) longest = current;

  await supabase
    .from("student_engagement")
    .update({
      current_streak: current,
      longest_streak: longest,
      last_active_date: today,
      freeze_credits: Math.max(0, (row.freeze_credits ?? 0) - (freezeUsed ? 1 : 0)),
    })
    .eq("student_id", studentId);

  return { current, longest, freezeUsed };
}

async function syncDailyGoal(
  supabase: any,
  studentId: string,
  row: any,
  addMinutes: number,
  addXp: number,
): Promise<{ goal: any; justCompleted: boolean }> {
  const date = todayISO();
  const { data: existing } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("student_id", studentId)
    .eq("goal_date", date)
    .maybeSingle();

  const target_minutes = row.daily_goal_minutes ?? 20;
  const target_xp = Math.max(100, Math.round(target_minutes * 6));

  let goal = existing;
  if (!goal) {
    const { data } = await supabase
      .from("daily_goals")
      .insert({
        student_id: studentId,
        goal_date: date,
        target_minutes,
        target_xp,
        minutes_done: addMinutes,
        xp_earned: addXp,
      })
      .select("*")
      .single();
    goal = data;
  } else {
    const newMinutes = (goal.minutes_done ?? 0) + addMinutes;
    const newXp = (goal.xp_earned ?? 0) + addXp;
    const justHit =
      !goal.completed_at && (newMinutes >= target_minutes || newXp >= target_xp);
    const { data } = await supabase
      .from("daily_goals")
      .update({
        minutes_done: newMinutes,
        xp_earned: newXp,
        completed_at: justHit ? new Date().toISOString() : goal.completed_at,
      })
      .eq("id", goal.id)
      .select("*")
      .single();
    goal = data;
  }

  const justCompleted =
    !!goal?.completed_at &&
    (!existing || !existing.completed_at);

  return { goal, justCompleted };
}

async function syncLevel(
  supabase: any,
  studentId: string,
  totalXp: number,
): Promise<{ level: number; xpIntoLevel: number; xpForNext: number; leveledUp: boolean }> {
  const info = levelFromXp(totalXp);
  const { data: row } = await supabase
    .from("student_engagement")
    .select("level")
    .eq("student_id", studentId)
    .maybeSingle();
  const prev = row?.level ?? 1;
  const leveledUp = info.level > prev;
  if (leveledUp) {
    await supabase
      .from("student_engagement")
      .update({ level: info.level })
      .eq("student_id", studentId);
  }
  return { ...info, leveledUp };
}

// -------------------------------------------------------------
// Achievements
// -------------------------------------------------------------

async function checkAchievements(
  supabase: any,
  studentId: string,
  signals: EngagementSignals,
): Promise<Array<{ code: string; title: string; xp: number }>> {
  const { data: catalog } = await supabase
    .from("achievements")
    .select("id, code, title, criteria, xp_reward")
    .eq("active", true);
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("student_id", studentId);

  const unlockedSet = new Set((unlocked ?? []).map((u: any) => u.achievement_id));

  // Pre-compute counters
  const { count: recallHigh } = await supabase
    .from("recollection_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .gte("ai_score", 0.8);
  const { count: quizHigh } = await supabase
    .from("quiz_attempts")
    .select("id, score, total", { count: "exact", head: true })
    .eq("student_id", studentId);
  const { count: goalsHit } = await supabase
    .from("daily_goals")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("completed_at", "is", null);
  const { count: challengesDone } = await supabase
    .from("smart_challenges")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  const newlyUnlocked: Array<{ code: string; title: string; xp: number }> = [];

  for (const a of catalog ?? []) {
    if (unlockedSet.has(a.id)) continue;
    const c = (a.criteria ?? {}) as Record<string, number>;
    let pass = false;
    if (c.streak && signals.currentStreak >= c.streak) pass = true;
    if (c.total_xp && signals.totalXp >= c.total_xp) pass = true;
    if (c.recall_high && (recallHigh ?? 0) >= c.recall_high) pass = true;
    if (c.quiz_high && (quizHigh ?? 0) >= c.quiz_high) pass = true;
    if (c.goals_hit && (goalsHit ?? 0) >= c.goals_hit) pass = true;
    if (c.challenges_done && (challengesDone ?? 0) >= c.challenges_done) pass = true;
    if (c.micro_concepts && signals.daysActiveLast14 > 0) {
      const { count } = await supabase
        .from("learning_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("state", "mastered");
      if ((count ?? 0) >= c.micro_concepts) pass = true;
    }
    if (pass) {
      const { error } = await supabase
        .from("user_achievements")
        .insert({ student_id: studentId, achievement_id: a.id });
      if (!error) {
        newlyUnlocked.push({ code: a.code, title: a.title, xp: a.xp_reward });
      }
    }
  }
  return newlyUnlocked;
}

// -------------------------------------------------------------
// Server functions
// -------------------------------------------------------------

const awardSchema = z.object({
  kind: z.enum([
    "study", "recall", "quiz", "mastery_up", "streak_bonus",
    "daily_goal", "challenge", "achievement", "remediation", "manual",
  ]),
  points: z.number().int().min(0).max(2000),
  refId: z.string().uuid().optional(),
  minutes: z.number().int().min(0).max(600).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const awardXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => awardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const row = await ensureEngagementRow(supabase, userId);

    const meta = { ...(data.metadata ?? {}), ...(data.minutes ? { minutes: data.minutes } : {}) };
    await supabase.from("xp_events").insert({
      student_id: userId,
      kind: data.kind,
      points: data.points,
      ref_id: data.refId ?? null,
      metadata: meta,
    });

    const newTotal = (row.total_xp ?? 0) + data.points;
    await supabase
      .from("student_engagement")
      .update({ total_xp: newTotal })
      .eq("student_id", userId);

    const streak = await syncStreakOnActivity(supabase, userId, row);
    const fresh = await ensureEngagementRow(supabase, userId);
    const goal = await syncDailyGoal(supabase, userId, fresh, data.minutes ?? 0, data.points);
    const level = await syncLevel(supabase, userId, newTotal);

    // streak milestone bonus (one-shot inside the same flow)
    let streakBonus = 0;
    if (streak.current > 0 && streak.current % 7 === 0 && streak.current !== row.current_streak) {
      streakBonus = 50 + Math.min(150, streak.current * 2);
      await supabase.from("xp_events").insert({
        student_id: userId,
        kind: "streak_bonus",
        points: streakBonus,
        metadata: { streak: streak.current },
      });
      await supabase
        .from("student_engagement")
        .update({ total_xp: newTotal + streakBonus })
        .eq("student_id", userId);
    }

    // goal-hit XP bonus
    let goalBonus = 0;
    if (goal.justCompleted) {
      goalBonus = 60;
      await supabase.from("xp_events").insert({
        student_id: userId,
        kind: "daily_goal",
        points: goalBonus,
        metadata: { date: todayISO() },
      });
      await supabase
        .from("student_engagement")
        .update({ total_xp: newTotal + streakBonus + goalBonus })
        .eq("student_id", userId);
    }

    const signals = await loadSignals(supabase, userId, {
      ...fresh,
      total_xp: newTotal + streakBonus + goalBonus,
      current_streak: streak.current,
      longest_streak: streak.longest,
    });
    const unlocked = await checkAchievements(supabase, userId, signals);

    let achievementBonus = 0;
    for (const u of unlocked) achievementBonus += u.xp;
    if (achievementBonus > 0) {
      await supabase.from("xp_events").insert(
        unlocked.map((u) => ({
          student_id: userId,
          kind: "achievement",
          points: u.xp,
          metadata: { code: u.code, title: u.title },
        })),
      );
      await supabase
        .from("student_engagement")
        .update({ total_xp: newTotal + streakBonus + goalBonus + achievementBonus })
        .eq("student_id", userId);
    }

    return {
      added: data.points,
      streakBonus,
      goalBonus,
      achievementBonus,
      totalXp: newTotal + streakBonus + goalBonus + achievementBonus,
      streak,
      goalJustCompleted: goal.justCompleted,
      leveledUp: level.leveledUp,
      level: level.level,
      unlocked,
      freezeUsed: streak.freezeUsed,
    };
  });

export const checkInStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const row = await ensureEngagementRow(supabase, userId);
    const streak = await syncStreakOnActivity(supabase, userId, row);
    return streak;
  });

export const getEngagementProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const row = await ensureEngagementRow(supabase, userId);
    const signals = await loadSignals(supabase, userId, row);

    const tone = pickMotivationTone(signals);
    const burnout = burnoutScore(signals);
    const suggestedGoal = suggestDailyGoalMinutes(signals);
    const copy = motivationCopy(signals, tone);
    const level = levelFromXp(signals.totalXp);

    // persist burnout score (cheap)
    if (Math.abs((row.burnout_score ?? 0) - burnout) > 0.05) {
      await supabase
        .from("student_engagement")
        .update({ burnout_score: burnout })
        .eq("student_id", userId);
    }

    // today goal
    const { data: goalToday } = await supabase
      .from("daily_goals")
      .select("*")
      .eq("student_id", userId)
      .eq("goal_date", todayISO())
      .maybeSingle();

    // last 14 days for sparkline
    const since = new Date(Date.now() - 14 * DAY).toISOString().slice(0, 10);
    const { data: goalHistory } = await supabase
      .from("daily_goals")
      .select("goal_date, target_minutes, minutes_done, xp_earned, completed_at")
      .eq("student_id", userId)
      .gte("goal_date", since)
      .order("goal_date", { ascending: true });

    // achievements
    const [{ data: catalog }, { data: unlocked }] = await Promise.all([
      supabase.from("achievements").select("*").eq("active", true).order("rarity"),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("student_id", userId),
    ]);
    const unlockedMap = new Map(
      (unlocked ?? []).map((u: any) => [u.achievement_id, u.unlocked_at]),
    );

    // active challenges
    const { data: challenges } = await supabase
      .from("smart_challenges")
      .select("*")
      .eq("student_id", userId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // recent XP events
    const { data: recentEvents } = await supabase
      .from("xp_events")
      .select("kind, points, metadata, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    return {
      profile: {
        totalXp: signals.totalXp,
        level: level.level,
        xpIntoLevel: level.xpIntoLevel,
        xpForNext: level.xpForNext,
        currentStreak: signals.currentStreak,
        longestStreak: signals.longestStreak,
        freezeCredits: row.freeze_credits ?? 0,
        burnoutScore: burnout,
        motivationProfile: row.motivation_profile ?? "balanced",
        dailyGoalMinutes: row.daily_goal_minutes ?? 20,
        weeklyGoalXp: row.weekly_goal_xp ?? 700,
        suggestedGoalMinutes: suggestedGoal,
      },
      tone,
      motivation: copy,
      signals,
      goalToday,
      goalHistory: goalHistory ?? [],
      achievements: (catalog ?? []).map((a: any) => ({
        ...a,
        unlockedAt: unlockedMap.get(a.id) ?? null,
      })),
      challenges: challenges ?? [],
      recentEvents: recentEvents ?? [],
    };
  });

const goalSchema = z.object({
  dailyGoalMinutes: z.number().int().min(5).max(180).optional(),
  weeklyGoalXp: z.number().int().min(100).max(10000).optional(),
  motivationProfile: z.enum(["gentle", "balanced", "driven"]).optional(),
});

export const updateGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => goalSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureEngagementRow(supabase, userId);
    const patch: Record<string, unknown> = {};
    if (data.dailyGoalMinutes != null) patch.daily_goal_minutes = data.dailyGoalMinutes;
    if (data.weeklyGoalXp != null) patch.weekly_goal_xp = data.weeklyGoalXp;
    if (data.motivationProfile) patch.motivation_profile = data.motivationProfile;
    if (Object.keys(patch).length === 0) return { ok: true };
    await supabase.from("student_engagement").update(patch as any).eq("student_id", userId);
    return { ok: true };
  });

export const generateChallenges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const row = await ensureEngagementRow(supabase, userId);
    const signals = await loadSignals(supabase, userId, row);

    // Don't pile on if active challenges already exist
    const { data: active } = await supabase
      .from("smart_challenges")
      .select("id")
      .eq("student_id", userId)
      .is("completed_at", null)
      .gte("expires_at", new Date().toISOString());
    if ((active ?? []).length >= 3) {
      return { created: 0, message: "You already have active challenges." };
    }

    const specs = suggestChallenges(signals);
    const rows = specs.map((s) => ({
      student_id: userId,
      kind: s.kind,
      title: s.title,
      description: s.description,
      target: s.target,
      progress: {},
      difficulty: s.difficulty,
      xp_reward: s.xpReward,
      ai_rationale: s.rationale,
      ai_generated: true,
      expires_at: new Date(Date.now() + s.expiresInHours * 3600 * 1000).toISOString(),
    }));
    if (rows.length === 0) return { created: 0, message: "No challenges suggested right now." };

    const { data: inserted } = await supabase
      .from("smart_challenges")
      .insert(rows)
      .select("*");
    return { created: inserted?.length ?? 0, challenges: inserted ?? [] };
  });

const completeSchema = z.object({
  challengeId: z.string().uuid(),
});

export const completeChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => completeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase
      .from("smart_challenges")
      .select("*")
      .eq("id", data.challengeId)
      .eq("student_id", userId)
      .maybeSingle();
    if (!c) throw new Error("Challenge not found");
    if (c.completed_at) return { ok: true, alreadyCompleted: true, xp: 0 };

    const nowIso = new Date().toISOString();
    await supabase
      .from("smart_challenges")
      .update({ completed_at: nowIso, claimed_at: nowIso })
      .eq("id", data.challengeId);

    // award xp via standard pipeline
    const row = await ensureEngagementRow(supabase, userId);
    const newTotal = (row.total_xp ?? 0) + (c.xp_reward ?? 0);
    await supabase
      .from("xp_events")
      .insert({
        student_id: userId,
        kind: "challenge",
        points: c.xp_reward ?? 0,
        ref_id: c.id,
        metadata: { title: c.title, kind: c.kind },
      });
    await supabase
      .from("student_engagement")
      .update({ total_xp: newTotal })
      .eq("student_id", userId);

    return { ok: true, alreadyCompleted: false, xp: c.xp_reward ?? 0, totalXp: newTotal };
  });

// -------------------------------------------------------------
// Leaderboard
// -------------------------------------------------------------

const lbSchema = z.object({
  scope: z.enum(["global", "grade", "class"]).default("global"),
  period: z.enum(["day", "week", "month", "all"]).default("week"),
  limit: z.number().int().min(5).max(100).default(25),
});

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => lbSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const since = (() => {
      if (data.period === "all") return null;
      const ms =
        data.period === "day" ? DAY :
        data.period === "week" ? 7 * DAY :
        30 * DAY;
      return new Date(Date.now() - ms).toISOString();
    })();

    // Aggregate XP by student via admin (RLS would hide other students)
    let q = supabaseAdmin
      .from("xp_events")
      .select("student_id, points")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (since) q = q.gte("created_at", since);
    const { data: events } = await q;

    const byStudent = new Map<string, number>();
    for (const e of events ?? []) {
      byStudent.set(e.student_id, (byStudent.get(e.student_id) ?? 0) + (e.points ?? 0));
    }

    // Need profile info for display + grade filter
    const ids = [...byStudent.keys()];
    if (ids.length === 0) {
      return { rows: [], me: null, scope: data.scope, period: data.period };
    }

    const [{ data: profiles }, { data: engagements }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, grade")
        .in("user_id", ids),
      supabaseAdmin
        .from("student_engagement")
        .select("student_id, current_streak, total_xp")
        .in("student_id", ids),
    ]);

    const profMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const engMap = new Map((engagements ?? []).map((e: any) => [e.student_id, e]));

    let rows = ids.map((id) => {
      const p = profMap.get(id) as any;
      const e = engMap.get(id) as any;
      const masked =
        p?.full_name
          ? p.full_name
              .split(" ")
              .map((part: string, i: number) =>
                i === 0 ? part : (part[0] ?? "") + ".",
              )
              .join(" ")
          : "Learner";
      return {
        studentId: id,
        name: masked,
        grade: p?.grade ?? null,
        xp: byStudent.get(id) ?? 0,
        totalXp: e?.total_xp ?? 0,
        streak: e?.current_streak ?? 0,
        isMe: id === userId,
      };
    });

    // Scope filter
    if (data.scope === "grade" || data.scope === "class") {
      const meProf = profMap.get(userId) as any;
      const grade = meProf?.grade;
      if (grade) rows = rows.filter((r) => r.grade === grade);
    }

    rows.sort((a, b) => b.xp - a.xp);
    rows = rows.slice(0, data.limit).map((r, i) => ({ ...r, rank: i + 1 }));

    const me = rows.find((r) => r.isMe) ?? null;

    return { rows, me, scope: data.scope, period: data.period };
  });
