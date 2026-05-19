import { createFileRoute, Link, Navigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, Flame, Target, Clock, TrendingUp, BookOpen, Trophy, Bell,
  ChevronRight, Activity, CheckCircle2, BrainCircuit, CalendarDays, Award, Zap,
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { getStudentDashboard } from "@/lib/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } as never });
  },
  component: Dashboard,
});

function Dashboard() {
  const { hasRole, profile } = useAuth();
  if (hasRole("admin")) return <Navigate to="/admin" />;
  if (hasRole("parent")) return <Navigate to="/parent" />;

  const fetchDash = useServerFn(getStudentDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => fetchDash(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";
  const goalPct = Math.min(100, Math.round((data.todayMinutes / Math.max(1, data.goalMinutes)) * 100));

  return (
    <div className="animate-fade-in space-y-6">
      <HeroGreeting name={firstName} streak={data.streak} goalPct={goalPct} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <DailyGoalCard minutes={data.todayMinutes} goal={data.goalMinutes} pct={goalPct} />
            <StatCard
              icon={<Flame className="h-4 w-4" />}
              label="Study streak"
              value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`}
              accent="from-orange-500/20 to-red-500/10"
              hint={data.streak >= 3 ? "🔥 On fire — keep going" : "Practice today to start a streak"}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg score (30d)"
              value={`${data.avgScore}%`}
              accent="from-emerald-500/20 to-teal-500/10"
              hint={`${data.masteryAvg}% concept mastery`}
            />
          </div>

          <ActivityChart days={data.activityDays} />

          <AIRecommendations
            summary={data.path?.summary}
            focus={data.focusSubjects}
            goals={data.goals}
            tips={data.tips}
            generatedAt={data.generatedAt}
          />

          <SubjectsGrid focus={data.focusSubjects} subjects={data.subjects} />
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <TodayPlanCard plan={data.weeklyPlan} />
          <UpcomingTests />
          <Leaderboard />
          <RecentActivity items={data.activity} />
          <SmartReminders streak={data.streak} todayMinutes={data.todayMinutes} goal={data.goalMinutes} />
        </aside>
      </div>
    </div>
  );
}

/* -------------------- Hero -------------------- */
function HeroGreeting({ name, streak, goalPct }: { name: string; streak: number; goalPct: number }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{greet}</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {goalPct >= 100
              ? "You've hit today's goal — bonus practice unlocks streak rewards."
              : `You're ${goalPct}% to today's goal. A focused 20-minute session moves the needle.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5" /> {streak}-day streak
          </span>
          <Link
            to="/student/study-path"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> Start studying
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Daily Goal -------------------- */
function DailyGoalCard({ minutes, goal, pct }: { minutes: number; goal: number; pct: number }) {
  const chartData = [{ name: "goal", value: pct, fill: "hsl(var(--primary))" }];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Target className="h-4 w-4 text-primary" /> Today's goal
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{pct}%</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-24 w-24">
          <ResponsiveContainer>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold">{minutes}<span className="text-sm text-muted-foreground">m</span></div>
          <div className="text-xs text-muted-foreground">of {goal} min</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, hint, accent,
}: { icon: React.ReactNode; label: string; value: string; hint?: string; accent: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card p-4")}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", accent)} />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon} {label}
        </div>
        <div className="font-display mt-2 text-2xl font-semibold">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

/* -------------------- Activity Chart -------------------- */
function ActivityChart({ days }: { days: { date: string; minutes: number; score: number }[] }) {
  const data = days.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }) }));
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold">Last 14 days</h2>
          <p className="text-xs text-muted-foreground">Practice minutes & accuracy</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          <Activity className="h-3 w-3" /> Live
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* -------------------- AI Recommendations -------------------- */
function AIRecommendations({
  summary, focus, goals, tips, generatedAt,
}: { summary?: string; focus: string[]; goals: string[]; tips: string[]; generatedAt: string | null }) {
  if (!summary && focus.length === 0 && goals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-6 text-center">
        <BrainCircuit className="mx-auto h-8 w-8 text-primary" />
        <h3 className="font-display mt-3 text-base font-semibold">Get your AI study path</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tell us your goals and we'll generate a week-1 plan.</p>
        <Link to="/onboarding" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
          <Sparkles className="h-4 w-4" /> Personalize now
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold">AI recommendations</h2>
            {generatedAt && <p className="text-[10px] text-muted-foreground">Updated {new Date(generatedAt).toLocaleDateString()}</p>}
          </div>
        </div>
        <Link to="/student/ai-tutor" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Open tutor <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {summary && <p className="text-sm text-foreground/90">{summary}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {goals.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This week's goals</div>
            <ul className="space-y-1.5">
              {goals.slice(0, 3).map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {g}
                </li>
              ))}
            </ul>
          </div>
        )}
        {tips.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Smart tips</div>
            <ul className="space-y-1.5">
              {tips.slice(0, 3).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Subjects -------------------- */
function SubjectsGrid({ focus, subjects }: { focus: string[]; subjects: { id: string; name: string; slug: string; icon: string | null }[] }) {
  const list = useMemo(() => {
    if (subjects.length) return subjects.map((s) => ({ name: s.name, slug: s.slug, focus: focus.includes(s.name) }));
    return (focus.length ? focus : ["Mathematics", "Physics", "Chemistry", "Biology"]).map((name) => ({
      name, slug: name.toLowerCase().replace(/\s+/g, "-"), focus: true,
    }));
  }, [focus, subjects]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">Your subjects</h2>
        <Link to="/student/subjects" className="text-xs font-semibold text-primary hover:underline">
          See all
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, 6).map((s) => (
          <Link
            key={s.slug}
            to="/student/subjects"
            className="group rounded-lg border bg-background p-3 transition-soft hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              {s.focus && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Focus
                </span>
              )}
            </div>
            <div className="mt-2 text-sm font-semibold">{s.name}</div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Continue learning</span>
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Today Plan -------------------- */
function TodayPlanCard({ plan }: { plan: { day: string; subject: string; topic: string; minutes: number }[] }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "short" });
  const todays = plan.filter((p) => p.day?.toLowerCase().startsWith(today.toLowerCase().slice(0, 3))) ?? [];
  const items = (todays.length ? todays : plan.slice(0, 2)).slice(0, 3);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-semibold">Today's plan</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No plan yet. Generate one from onboarding.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-semibold">{it.subject}</div>
                <div className="truncate text-[10px] text-muted-foreground">{it.topic}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {it.minutes}m
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* -------------------- Upcoming Tests -------------------- */
function UpcomingTests() {
  const tests = [
    { name: "Algebra Mastery", subject: "Mathematics", in: "Tomorrow", duration: "25m" },
    { name: "Periodic Trends", subject: "Chemistry", in: "Fri", duration: "20m" },
  ];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Upcoming tests</h2>
        </div>
        <Link to="/student/tests" className="text-xs font-semibold text-primary hover:underline">All</Link>
      </div>
      <ul className="space-y-2">
        {tests.map((t) => (
          <li key={t.name} className="rounded-lg border p-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold">{t.name}</div>
              <span className="rounded-full bg-info/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-info">{t.in}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{t.subject}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------- Leaderboard -------------------- */
function Leaderboard() {
  const rows = [
    { rank: 1, name: "Aanya S.", score: 4820, you: false },
    { rank: 2, name: "You", score: 4610, you: true },
    { rank: 3, name: "Ishaan K.", score: 4490, you: false },
    { rank: 4, name: "Meera P.", score: 4220, you: false },
  ];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Leaderboard</h2>
        </div>
        <Link to="/student/leaderboard" className="text-xs font-semibold text-primary hover:underline">All</Link>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={cn(
              "flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs",
              r.you && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                r.rank === 1 ? "bg-amber-400/20 text-amber-600" :
                r.rank === 2 ? "bg-zinc-400/20 text-zinc-600 dark:text-zinc-300" :
                r.rank === 3 ? "bg-orange-500/20 text-orange-600" :
                "bg-muted text-muted-foreground",
              )}>
                {r.rank}
              </span>
              <span className={cn("font-medium", r.you && "text-primary")}>{r.name}</span>
            </div>
            <span className="tabular-nums font-semibold">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------- Recent Activity -------------------- */
function RecentActivity({ items }: { items: { kind: "quiz" | "eval" | "lesson"; when: string; label: string; detail: string }[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 inline-flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Recent activity</h2>
        </div>
        <p className="text-xs text-muted-foreground">Your wins will show up here as you practice.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="font-display mb-3 inline-flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" /> Recent activity
      </h2>
      <ol className="space-y-2">
        {items.slice(0, 5).map((a, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{a.label}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(a.when)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{a.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* -------------------- Smart Reminders -------------------- */
function SmartReminders({ streak, todayMinutes, goal }: { streak: number; todayMinutes: number; goal: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, goal - todayMinutes);
  const reminders = [
    remaining > 0 && {
      icon: <Bell className="h-3.5 w-3.5" />,
      text: `${remaining} min left to hit today's goal`,
    },
    streak > 0 && streak < 3 && {
      icon: <Flame className="h-3.5 w-3.5" />,
      text: `Practice tomorrow to grow your ${streak}-day streak`,
    },
    now.getHours() >= 20 && {
      icon: <BrainCircuit className="h-3.5 w-3.5" />,
      text: "Quick recall session before bed boosts retention by 30%",
    },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  if (!reminders.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="font-display mb-2 inline-flex items-center gap-2 text-sm font-semibold">
        <Bell className="h-4 w-4 text-primary" /> Smart reminders
      </h2>
      <ul className="space-y-2">
        {reminders.map((r, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs">
            <span className="mt-0.5 text-primary">{r.icon}</span>
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------- Skeleton -------------------- */
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-2xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-muted" />)}
          </div>
          <div className="h-56 rounded-xl bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted" />)}
        </div>
      </div>
    </div>
  );
}
