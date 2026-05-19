import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Sparkles, Target, Repeat, Brain, MapPin, Trophy, Compass, BookOpen,
  Flame, CheckCircle2, Lock, Clock, TrendingUp, Calendar, Zap, ArrowRight,
  RefreshCw, AlertCircle, Award, ChevronRight,
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  RadialBar, RadialBarChart, PolarAngleAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getSmartStudyPath } from "@/lib/study-path.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/study-path")({
  head: () => ({
    meta: [
      { title: "Smart Study Path — Smart Lab Online" },
      { name: "description", content: "Your AI-driven adaptive learning journey with chapter roadmap, smart revisions, milestones, and analytics." },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } as never });
  },
  component: StudyPathPage,
});

function StudyPathPage() {
  const fetchPath = useServerFn(getSmartStudyPath);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["smart-study-path"],
    queryFn: () => fetchPath(),
    staleTime: 60_000,
  });

  if (isLoading || !data) return <Skeleton />;

  if (!data.hasPath) {
    return (
      <div className="animate-fade-in mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center elev-2">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="font-display mt-4 text-2xl font-semibold">Build your study path</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tell us about your grade, board and goals — the AI will craft a personalized weekly roadmap.
        </p>
        <Link
          to="/onboarding"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition"
        >
          Start onboarding <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Hero data={data} onRefresh={() => refetch()} refreshing={isFetching} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Roadmap data={data} />
          <Schedule schedule={data.schedule} />
          <RevisionEngine revisions={data.revisions} />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <OverallCard data={data} />
          <DifficultyCard difficulty={data.difficulty} insight={data.adaptiveInsight} accuracy={data.accuracy} />
          <AiTips tips={data.aiTips} />
          <Milestones milestones={data.milestones} mastered={data.masteredCount} />
        </div>
      </div>

      <Analytics trend={data.trend} overall={data.overallProgress} completed={data.completedChapters} total={data.totalChapters} />
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero({ data, onRefresh, refreshing }: { data: any; onRefresh: () => void; refreshing: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 elev-2 md:p-8">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="text-primary inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> AI-driven study path
          </div>
          <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            Your personalized learning journey
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{data.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {data.focus.slice(0, 5).map((s: string) => (
              <span key={s} className="bg-background/80 rounded-full border px-3 py-1 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="bg-background hover:bg-accent inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Recompute
          </button>
          <Link
            to="/student/ai-tutor"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition"
          >
            Ask AI tutor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- ROADMAP ---------- */
function Roadmap({ data }: { data: any }) {
  return (
    <section className="rounded-2xl border bg-card p-6 elev-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Chapter roadmap</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Progressive chapters per focus subject — unlocked as mastery grows.
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
          {data.completedChapters}/{data.totalChapters} chapters
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {data.roadmap.map((track: any) => (
          <div key={track.subject}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-semibold">{track.subject}</span>
              </div>
              <span className="text-muted-foreground text-xs font-medium">{track.progress}%</span>
            </div>

            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-700"
                style={{ width: `${track.progress}%` }}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {track.chapters.map((ch: any, i: number) => (
                <ChapterNode key={ch.id} chapter={ch} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChapterNode({ chapter, index }: { chapter: any; index: number }) {
  const Icon =
    chapter.status === "complete" ? CheckCircle2 :
    chapter.status === "locked" ? Lock : Sparkles;
  const tone =
    chapter.status === "complete" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600" :
    chapter.status === "in_progress" ? "border-primary/40 bg-primary/5 text-primary" :
    chapter.status === "started" ? "border-amber-500/40 bg-amber-500/5 text-amber-600" :
    "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("group relative rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md", tone)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Step {index + 1}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{chapter.label}</div>
      <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
        <Clock className="h-3 w-3" /> ~{chapter.minutes} min
      </div>
      <div className="bg-background/60 mt-2 h-1 overflow-hidden rounded-full">
        <div className="h-full bg-current opacity-70 transition-all" style={{ width: `${chapter.progress}%` }} />
      </div>
    </div>
  );
}

/* ---------- SCHEDULE ---------- */
function Schedule({ schedule }: { schedule: any[] }) {
  return (
    <section className="rounded-2xl border bg-card p-6 elev-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary h-5 w-5" />
          <h2 className="font-display text-lg font-semibold">Weekly schedule</h2>
        </div>
        <span className="text-muted-foreground text-xs">Auto-balanced by the AI</span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-7">
        {schedule.map((d) => (
          <div
            key={d.day}
            className={cn(
              "rounded-xl border p-3 transition",
              d.isToday ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-semibold", d.isToday && "text-primary")}>{d.day}</span>
              {d.isToday && <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px] font-bold">NOW</span>}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums">{d.minutes}<span className="text-muted-foreground text-xs font-medium">m</span></div>
            <ul className="mt-2 space-y-1">
              {d.items.slice(0, 2).map((it: any, i: number) => (
                <li key={i} className="text-muted-foreground truncate text-[10px]">• {it.subject}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- REVISION ENGINE ---------- */
function RevisionEngine({ revisions }: { revisions: any[] }) {
  return (
    <section className="rounded-2xl border bg-card p-6 elev-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="text-primary h-5 w-5" />
          <div>
            <h2 className="font-display text-lg font-semibold">Smart revision engine</h2>
            <p className="text-muted-foreground text-xs">Spaced repetition — concepts about to fade get queued first.</p>
          </div>
        </div>
      </div>

      {revisions.length === 0 ? (
        <div className="text-muted-foreground mt-6 rounded-xl border border-dashed py-8 text-center text-sm">
          Nothing due for revision — keep building mastery and items will appear here.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {revisions.map((r, i) => {
            const due = r.dueInHours;
            const dueLabel = due === null ? "—" : due < 0 ? `${Math.abs(due)}h overdue` : `in ${due}h`;
            const tone = r.urgency > 70 ? "text-red-500" : r.urgency > 35 ? "text-amber-500" : "text-emerald-500";
            return (
              <li key={i} className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between gap-3 rounded-xl border p-3 transition">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">Concept revision</div>
                    <div className="text-muted-foreground text-xs">
                      Mastery {r.mastery}% · streak {r.streak} · due {dueLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden w-28 sm:block">
                    <div className="bg-background h-1.5 overflow-hidden rounded-full">
                      <div className={cn("h-full bg-current", tone)} style={{ width: `${r.urgency}%` }} />
                    </div>
                  </div>
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition">
                    Revise <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- SIDE: OVERALL ---------- */
function OverallCard({ data }: { data: any }) {
  const chartData = [{ name: "progress", value: data.overallProgress, fill: "hsl(var(--primary))" }];
  return (
    <section className="rounded-2xl border bg-card p-5 elev-2">
      <div className="flex items-center gap-2">
        <Target className="text-primary h-4 w-4" />
        <h3 className="text-sm font-semibold">Overall progress</h3>
      </div>
      <div className="relative mx-auto mt-2 h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "hsl(var(--muted))" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-3xl font-bold tabular-nums">{data.overallProgress}%</div>
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">complete</div>
        </div>
      </div>
      <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-muted/40 rounded-lg p-2">
          <div className="text-foreground text-sm font-bold">{data.completedChapters}</div>
          <div className="text-[10px]">Chapters done</div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <div className="text-foreground text-sm font-bold">{data.masteredCount}</div>
          <div className="text-[10px]">Concepts mastered</div>
        </div>
      </div>
    </section>
  );
}

function DifficultyCard({ difficulty, insight, accuracy }: { difficulty: string; insight: string; accuracy: number }) {
  const tone =
    difficulty === "harder" ? "from-emerald-500/20 to-emerald-500/5 text-emerald-600" :
    difficulty === "easier" ? "from-amber-500/20 to-amber-500/5 text-amber-600" :
    "from-primary/20 to-primary/5 text-primary";
  const label = difficulty === "harder" ? "Leveling up" : difficulty === "easier" ? "Easing in" : "Calibrated";
  return (
    <section className={cn("rounded-2xl border bg-gradient-to-br p-5 elev-2", tone)}>
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-foreground">Difficulty adjustment</h3>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold">{label}</span>
        <span className="text-muted-foreground text-xs">· accuracy {accuracy}%</span>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">{insight}</p>
    </section>
  );
}

function AiTips({ tips }: { tips: string[] }) {
  if (!tips?.length) return null;
  return (
    <section className="rounded-2xl border bg-card p-5 elev-2">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary h-4 w-4" />
        <h3 className="text-sm font-semibold">AI recommendations</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {tips.slice(0, 4).map((t, i) => (
          <li key={i} className="text-muted-foreground bg-muted/30 rounded-lg border p-2.5 text-xs leading-relaxed">
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- MILESTONES ---------- */
function Milestones({ milestones, mastered }: { milestones: any[]; mastered: number }) {
  const iconMap: Record<string, any> = { spark: Sparkles, compass: Compass, book: BookOpen, target: Target, trophy: Trophy };
  return (
    <section className="rounded-2xl border bg-card p-5 elev-2">
      <div className="flex items-center gap-2">
        <Award className="text-primary h-4 w-4" />
        <h3 className="text-sm font-semibold">Milestone rewards</h3>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{mastered} concepts mastered</p>
      <ul className="mt-3 space-y-2">
        {milestones.map((m) => {
          const Icon = iconMap[m.icon] ?? Trophy;
          return (
            <li
              key={m.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition",
                m.unlocked ? "border-primary/40 bg-primary/5" : "bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  m.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{m.label}</span>
                  <span className="text-muted-foreground text-[10px]">{m.reward}</span>
                </div>
                <div className="bg-background mt-1.5 h-1 overflow-hidden rounded-full">
                  <div className="bg-primary h-full transition-all" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- ANALYTICS ---------- */
function Analytics({ trend, overall, completed, total }: { trend: any[]; overall: number; completed: number; total: number }) {
  const totalMinutes = useMemo(() => trend.reduce((s, t) => s + t.minutes, 0), [trend]);
  const avgAccuracy = useMemo(() => {
    const valid = trend.filter((t) => t.accuracy > 0);
    return valid.length ? Math.round(valid.reduce((s, t) => s + t.accuracy, 0) / valid.length) : 0;
  }, [trend]);

  return (
    <section className="rounded-2xl border bg-card p-6 elev-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary h-5 w-5" />
          <div>
            <h2 className="font-display text-lg font-semibold">Completion analytics</h2>
            <p className="text-muted-foreground text-xs">Last 14 days of practice and accuracy.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <AnalyticStat icon={<Flame className="h-3.5 w-3.5" />} label="Total minutes" value={`${totalMinutes}`} />
        <AnalyticStat icon={<Target className="h-3.5 w-3.5" />} label="Avg accuracy" value={`${avgAccuracy}%`} />
        <AnalyticStat icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Chapters" value={`${completed}/${total}`} />
        <AnalyticStat icon={<Zap className="h-3.5 w-3.5" />} label="Path progress" value={`${overall}%`} />
      </div>

      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="spMins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" fill="url(#spMins)" strokeWidth={2} />
            <Area type="monotone" dataKey="accuracy" stroke="#10b981" fill="url(#spAcc)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AnalyticStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        {icon} {label}
      </div>
      <div className="font-display mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

/* ---------- SKELETON ---------- */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-44 rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="bg-muted h-72 rounded-2xl" />
          <div className="bg-muted h-40 rounded-2xl" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="bg-muted h-56 rounded-2xl" />
          <div className="bg-muted h-40 rounded-2xl" />
        </div>
      </div>
      <div className="bg-muted h-72 rounded-2xl" />
    </div>
  );
}
