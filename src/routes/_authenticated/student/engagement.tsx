import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Flame, Trophy, Sparkles, Target, Zap, Loader2, Shield, Heart,
  CheckCircle2, Swords, Brain, TrendingUp, Lock,
} from "lucide-react";
import {
  getEngagementProfile, generateChallenges, completeChallenge, updateGoals,
} from "@/lib/gamification.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/engagement")({
  head: () => ({ meta: [{ title: "Engagement — Smart Lab Online" }] }),
  component: EngagementPage,
});

const toneColor: Record<string, string> = {
  celebrate: "from-primary/15",
  encourage: "from-accent/15",
  nudge: "from-secondary/30",
  rest: "from-destructive/10",
};

function EngagementPage() {
  const qc = useQueryClient();
  const fn = useServerFn(getEngagementProfile);
  const gen = useServerFn(generateChallenges);
  const done = useServerFn(completeChallenge);
  const setGoals = useServerFn(updateGoals);

  const q = useQuery({ queryKey: ["engagement"], queryFn: () => fn() });

  const genMut = useMutation({
    mutationFn: () => gen(),
    onSuccess: (r: any) => {
      toast.success(r?.created ? `${r.created} new challenges` : r?.message || "No new challenges");
      qc.invalidateQueries({ queryKey: ["engagement"] });
    },
  });
  const doneMut = useMutation({
    mutationFn: (id: string) => done({ data: { challengeId: id } }),
    onSuccess: (r: any) => {
      if (r?.alreadyCompleted) toast.info("Already completed");
      else toast.success(`+${r?.xp ?? 0} XP claimed`);
      qc.invalidateQueries({ queryKey: ["engagement"] });
    },
  });

  if (q.isLoading || !q.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your engagement profile…
      </div>
    );
  }

  const d = q.data;
  const p = d.profile;
  const goalPct = d.goalToday
    ? Math.min(100, Math.round(((d.goalToday.minutes_done ?? 0) / Math.max(1, d.goalToday.target_minutes ?? 20)) * 100))
    : 0;
  const levelPct = Math.round((p.xpIntoLevel / Math.max(1, p.xpForNext)) * 100);

  return (
    <section className="animate-fade-in space-y-8">
      <header>
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Engagement</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Healthy momentum, real rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI tunes goals, challenges, and motivation to your pace — and steps in when it sees burnout.
        </p>
      </header>

      {/* AI Motivation card */}
      <div className={`rounded-2xl border bg-gradient-to-br ${toneColor[d.tone] ?? "from-muted/30"} to-transparent p-6 elev-2`}>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI · {d.tone}</span>
          {p.burnoutScore >= 0.5 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              <Heart className="size-3" /> Burnout risk {Math.round(p.burnoutScore * 100)}%
            </span>
          )}
        </div>
        <h2 className="font-display text-xl font-semibold">{d.motivation.headline}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.motivation.body}</p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Flame className="size-4" />} label="Streak" value={`${p.currentStreak}d`} hint={`Best: ${p.longestStreak}d · ${p.freezeCredits} freezes`} />
        <Kpi icon={<Zap className="size-4" />} label="Level" value={`Lv ${p.level}`} hint={`${p.xpIntoLevel} / ${p.xpForNext} XP (${levelPct}%)`} />
        <Kpi icon={<Trophy className="size-4" />} label="Total XP" value={p.totalXp.toLocaleString()} hint="Lifetime" />
        <Kpi icon={<Target className="size-4" />} label="Daily goal" value={`${goalPct}%`} hint={`${d.goalToday?.minutes_done ?? 0} / ${p.dailyGoalMinutes} min`} tone={goalPct >= 100 ? "good" : "default"} />
      </div>

      {/* Level progress bar */}
      <div className="rounded-2xl border bg-card p-5 elev-2">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Level {p.level}</span>
          <span>Level {p.level + 1}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${levelPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {p.xpForNext - p.xpIntoLevel} XP to next level · suggested goal {p.suggestedGoalMinutes} min/day
        </p>
      </div>

      {/* Smart Challenges */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Smart challenges</h2>
          <button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {genMut.isPending ? <Loader2 className="size-3 animate-spin" /> : "Generate new"}
          </button>
        </div>
        {d.challenges.length === 0 ? (
          <EmptyCard
            icon={<Swords className="size-5 text-muted-foreground" />}
            title="No active challenges"
            body="Tap Generate to get AI-picked missions tuned to your current signals."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {d.challenges.map((c: any) => (
              <div key={c.id} className="rounded-2xl border bg-card p-4 elev-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {c.kind.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">Diff {c.difficulty}/5</span>
                </div>
                <h3 className="font-display text-base font-semibold">{c.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                {c.ai_rationale && (
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    <Sparkles className="mr-1 inline size-3 text-primary" />
                    {c.ai_rationale}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-sm text-primary">+{c.xp_reward} XP</span>
                  {c.completed_at ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="size-3" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => doneMut.mutate(c.id)}
                      disabled={doneMut.isPending}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.achievements.map((a: any) => {
            const locked = !a.unlockedAt;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 transition-soft ${
                  locked ? "bg-muted/30 opacity-60" : "bg-card elev-2"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  {locked ? <Lock className="size-4 text-muted-foreground" /> : <Trophy className="size-4 text-primary" />}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rarityClass(a.rarity)}`}>
                    {a.rarity}
                  </span>
                </div>
                <div className="font-display text-sm font-semibold">{a.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                <div className="mt-2 font-mono text-xs text-primary">+{a.xp_reward} XP</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Settings */}
      <SettingsCard
        initialMinutes={p.dailyGoalMinutes}
        initialProfile={p.motivationProfile}
        suggested={p.suggestedGoalMinutes}
        onSave={(payload) =>
          setGoals({ data: payload }).then(() => {
            toast.success("Goals updated");
            qc.invalidateQueries({ queryKey: ["engagement"] });
          })
        }
      />
    </section>
  );
}

function rarityClass(r: string) {
  switch (r) {
    case "legendary": return "bg-warning/15 text-warning";
    case "epic": return "bg-accent/15 text-accent";
    case "rare": return "bg-primary/15 text-primary";
    default: return "bg-muted text-muted-foreground";
  }
}

function Kpi({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone?: "good" | "default" }) {
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <div className="mb-2 flex items-center gap-2 text-primary">{icon}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl font-semibold ${tone === "good" ? "text-primary" : ""}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function EmptyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center elev-1">
      <div className="mb-2 flex justify-center">{icon}</div>
      <div className="font-display text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function SettingsCard({
  initialMinutes, initialProfile, suggested, onSave,
}: {
  initialMinutes: number;
  initialProfile: string;
  suggested: number;
  onSave: (p: { dailyGoalMinutes?: number; motivationProfile?: "gentle" | "balanced" | "driven" }) => Promise<unknown>;
}) {
  const [mins, setMins] = useState(initialMinutes);
  const [prof, setProf] = useState(initialProfile);
  return (
    <div className="rounded-2xl border bg-card p-5 elev-2">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="size-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Tune your engine</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Daily goal (minutes)</span>
          <input
            type="number" min={5} max={180} value={mins}
            onChange={(e) => setMins(Number(e.target.value))}
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">AI suggests {suggested} min/day based on your last 14 days.</span>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Motivation style</span>
          <select
            value={prof}
            onChange={(e) => setProf(e.target.value)}
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="gentle">Gentle — soft nudges, lower stakes</option>
            <option value="balanced">Balanced — default mix</option>
            <option value="driven">Driven — push harder, raise stakes</option>
          </select>
        </label>
      </div>
      <button
        onClick={() => onSave({ dailyGoalMinutes: mins, motivationProfile: prof as any })}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Save preferences
      </button>
    </div>
  );
}
