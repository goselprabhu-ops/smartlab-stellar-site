/**
 * Gamification AI helpers (server-only).
 *
 * Turns engagement signals into:
 *  - personalized motivation copy
 *  - adaptive challenge difficulty
 *  - burnout detection
 *  - smart challenge generation
 *
 * Deterministic core + optional LLM narration.
 */

export type EngagementSignals = {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  daysActiveLast14: number;
  avgMinutesPerActiveDay: number;
  recentAccuracy: number; // 0..1
  recentRecall: number;   // 0..1
  weakTagsCount: number;
  motivationProfile: "gentle" | "balanced" | "driven";
};

export type MotivationTone = "celebrate" | "encourage" | "nudge" | "rest";

/** Map signals to a tone. Used to bias both copy and challenge intensity. */
export function pickMotivationTone(s: EngagementSignals): MotivationTone {
  // Burnout-leaning → suggest rest, regardless of profile
  if (s.daysActiveLast14 >= 12 && s.avgMinutesPerActiveDay >= 75) return "rest";
  if (s.recentAccuracy < 0.4 && s.daysActiveLast14 >= 8) return "rest";

  // Long break → nudge gently
  if (!s.lastActiveDate) return "encourage";
  const daysSince = Math.floor(
    (Date.now() - new Date(s.lastActiveDate).getTime()) / 86_400_000,
  );
  if (daysSince >= 3) return "encourage";

  // Strong streak + good signals → celebrate
  if (s.currentStreak >= 7 && s.recentAccuracy >= 0.7) return "celebrate";

  // Default: nudge
  return "nudge";
}

/** Estimate burnout 0..1 from signals. Higher = more risk. */
export function burnoutScore(s: EngagementSignals): number {
  let score = 0;
  if (s.daysActiveLast14 >= 12) score += 0.25;
  if (s.avgMinutesPerActiveDay >= 90) score += 0.25;
  if (s.recentAccuracy < 0.5 && s.daysActiveLast14 >= 7) score += 0.2;
  if (s.recentRecall < 0.5 && s.daysActiveLast14 >= 7) score += 0.15;
  if (s.currentStreak >= 21 && s.recentAccuracy < 0.6) score += 0.15;
  return Math.min(1, Number(score.toFixed(2)));
}

/** Pick challenge difficulty 1..5 from signals + tone. */
export function pickChallengeDifficulty(
  s: EngagementSignals,
  tone: MotivationTone,
): number {
  if (tone === "rest") return 1;
  if (tone === "encourage") return Math.max(1, Math.min(2, s.level >= 5 ? 2 : 1));
  // base off recent accuracy
  const base = s.recentAccuracy >= 0.8 ? 4 : s.recentAccuracy >= 0.6 ? 3 : 2;
  if (tone === "celebrate") return Math.min(5, base + 1);
  return base;
}

/** Suggest a daily goal (minutes) the AI thinks is sustainable. */
export function suggestDailyGoalMinutes(s: EngagementSignals): number {
  const avg = Math.max(10, Math.round(s.avgMinutesPerActiveDay || 20));
  if (burnoutScore(s) >= 0.5) return Math.max(10, Math.round(avg * 0.6));
  if (s.recentAccuracy >= 0.75 && s.currentStreak >= 7) return Math.min(60, avg + 10);
  return Math.min(45, avg);
}

/** Deterministic motivation copy fallback (used when LLM is skipped). */
export function motivationCopy(
  s: EngagementSignals,
  tone: MotivationTone,
): { headline: string; body: string } {
  const name = ""; // caller can prepend
  switch (tone) {
    case "celebrate":
      return {
        headline: `${s.currentStreak}-day streak — keep the fire alive 🔥`,
        body: `Your recall is sharp (${Math.round(s.recentRecall * 100)}%). One micro-concept today locks in the streak.`,
      };
    case "encourage":
      return {
        headline: "Small step today beats nothing",
        body: `Just 10 focused minutes resets your momentum. You've still got ${s.longestStreak} days of muscle memory.`,
      };
    case "rest":
      return {
        headline: "Pause to retain — a smart move, not a setback",
        body: "Your brain consolidates during rest. Try a 5-minute recall warm-up, then take the evening off guilt-free.",
      };
    case "nudge":
    default:
      return {
        headline: `${name || "You"} are ${s.daysActiveLast14}/14 days active`,
        body: `One quick session today keeps your ${s.currentStreak}-day streak ticking. Aim for ${Math.round(s.avgMinutesPerActiveDay || 15)} minutes.`,
      };
  }
}

/** Suggest a smart challenge spec (no DB write). */
export type ChallengeSpec = {
  kind: "minutes" | "concepts" | "recall" | "quiz_score" | "streak" | "subject_focus" | "weakness_kill";
  title: string;
  description: string;
  target: Record<string, unknown>;
  difficulty: number;
  xpReward: number;
  rationale: string;
  expiresInHours: number;
};

export function suggestChallenges(s: EngagementSignals): ChallengeSpec[] {
  const tone = pickMotivationTone(s);
  const diff = pickChallengeDifficulty(s, tone);
  const xpBase = 60 + diff * 20;

  const out: ChallengeSpec[] = [];

  if (s.weakTagsCount > 0 && tone !== "rest") {
    out.push({
      kind: "weakness_kill",
      title: "Fix 2 weak concepts",
      description: "Run remediation on 2 concepts currently flagged weak.",
      target: { count: 2 },
      difficulty: Math.min(5, diff + 1),
      xpReward: xpBase + 40,
      rationale: `You have ${s.weakTagsCount} weak tags — fixing them compounds future recall.`,
      expiresInHours: 72,
    });
  }

  if (tone === "rest") {
    out.push({
      kind: "minutes",
      title: "Gentle 10-minute warm-up",
      description: "10 focused minutes on any micro-concept.",
      target: { minutes: 10 },
      difficulty: 1,
      xpReward: 60,
      rationale: "Your signals show fatigue. Short sessions protect long-term retention.",
      expiresInHours: 24,
    });
  } else {
    out.push({
      kind: "minutes",
      title: `${15 + diff * 5}-minute focus block`,
      description: `Spend ${15 + diff * 5} uninterrupted minutes learning today.`,
      target: { minutes: 15 + diff * 5 },
      difficulty: diff,
      xpReward: xpBase,
      rationale: `Matches your avg ${Math.round(s.avgMinutesPerActiveDay)} min/day capacity.`,
      expiresInHours: 24,
    });
  }

  if (s.recentRecall < 0.75 && tone !== "rest") {
    out.push({
      kind: "recall",
      title: "Recall sprint",
      description: "Hit 80%+ on 3 recollection attempts.",
      target: { count: 3, minScore: 0.8 },
      difficulty: diff,
      xpReward: xpBase + 20,
      rationale: `Recall avg ${Math.round(s.recentRecall * 100)}% — repetition will lift it fast.`,
      expiresInHours: 48,
    });
  }

  if (s.currentStreak >= 3 && tone === "celebrate") {
    out.push({
      kind: "streak",
      title: "Extend your streak to 10",
      description: `Study every day until you reach a ${Math.max(10, s.currentStreak + 3)}-day streak.`,
      target: { streak: Math.max(10, s.currentStreak + 3) },
      difficulty: Math.min(5, diff + 1),
      xpReward: xpBase + 60,
      rationale: "Momentum is the cheapest fuel — protect it.",
      expiresInHours: 168,
    });
  }

  return out.slice(0, 3);
}

/** Level curve: 100, 250, 450, 700, 1000, … (quadratic-ish). */
export function levelFromXp(xp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 1;
  let needed = 100;
  let cumulative = 0;
  while (xp >= cumulative + needed) {
    cumulative += needed;
    level++;
    needed = Math.round(100 + (level - 1) * 50 + Math.pow(level - 1, 1.5) * 10);
  }
  return {
    level,
    xpIntoLevel: xp - cumulative,
    xpForNext: needed,
  };
}
