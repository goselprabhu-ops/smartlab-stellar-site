import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Target, Clock, Flame, Brain, AlertTriangle,
  Download, Sparkles, BookOpen, ChevronRight,
} from "lucide-react";
import { getMyAnalytics } from "@/lib/analytics.functions";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/analytics")({
  head: () => ({ meta: [{ title: "Performance Analytics — Smart Lab Online" }] }),
  component: StudentAnalytics,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;

function StudentAnalytics() {
  const fn = useServerFn(getMyAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["my-analytics"], queryFn: () => fn() });

  const insights = useMemo(() => {
    if (!data) return [];
    const out: string[] = [];
    const { kpis, subjectStats, weakAreas, tagClusters } = data;
    if (kpis.trendDelta > 0.05)
      out.push(`You're improving — accuracy climbed ${Math.round(kpis.trendDelta * 100)}% in the last two weeks.`);
    if (kpis.trendDelta < -0.05)
      out.push(`Watch out — accuracy slipped ${Math.round(kpis.trendDelta * -100)}%. Try a quick revision session.`);
    if (kpis.streak >= 3) out.push(`${kpis.streak}-day study streak! Consistency is paying off.`);
    if (kpis.totalMinutes > 0)
      out.push(`Logged ~${kpis.totalMinutes} minutes across ${kpis.totalAttempts} attempts this month.`);
    const strong = [...subjectStats].sort((a, b) => b.accuracy - a.accuracy)[0];
    if (strong && strong.attempts >= 2)
      out.push(`Strongest subject: ${strong.name} at ${pct(strong.accuracy)} accuracy.`);
    const weak = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (weak && weak.attempts >= 2 && weak.accuracy < 0.7)
      out.push(`Focus area: ${weak.name} — currently ${pct(weak.accuracy)}.`);
    if (weakAreas.length) out.push(`${weakAreas.length} concepts below 50% mastery need revision.`);
    if (tagClusters[0]) out.push(`Recurring weakness pattern: "${tagClusters[0].tag}".`);
    return out.slice(0, 6);
  }, [data]);

  const downloadCsv = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Section,Field,Value");
    rows.push(`Summary,Attempts,${data.kpis.totalAttempts}`);
    rows.push(`Summary,Accuracy,${pct(data.kpis.accuracy)}`);
    rows.push(`Summary,Minutes,${data.kpis.totalMinutes}`);
    rows.push(`Summary,MasteryAvg,${pct(data.kpis.masteryAvg)}`);
    rows.push(`Summary,Streak,${data.kpis.streak}`);
    rows.push(`Summary,TrendDelta,${(data.kpis.trendDelta * 100).toFixed(1)}%`);
    rows.push("");
    rows.push("Subject,Attempts,Minutes,Accuracy");
    for (const s of data.subjectStats)
      rows.push(`${s.name},${s.attempts},${s.minutes},${pct(s.accuracy)}`);
    rows.push("");
    rows.push("Date,Attempts,Minutes,Accuracy");
    for (const d of data.timeline)
      rows.push(`${d.date},${d.attempts},${d.minutes},${pct(d.accuracy)}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) return <LoadingState />;

  const radarData = data.subjectStats.slice(0, 7).map((s) => ({
    subject: s.name.slice(0, 10),
    accuracy: Math.round(s.accuracy * 100),
  }));

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Analytics</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last 30 days · accuracy, time, mastery, and AI insights.</p>
        </div>
        <Button onClick={downloadCsv} variant="outline" size="sm" className="gap-2">
          <Download className="size-4" /> Export CSV
        </Button>
      </header>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Target className="size-4" />} label="Accuracy" value={pct(data.kpis.accuracy)}
             hint={`${data.kpis.totalAttempts} attempts`} accent="from-primary/15 to-primary/5" />
        <Kpi icon={<Clock className="size-4" />} label="Time studied" value={`${data.kpis.totalMinutes} min`}
             hint={`across ${data.timeline.filter((d) => d.attempts).length} active days`}
             accent="from-blue-500/15 to-blue-500/5" />
        <Kpi icon={<Brain className="size-4" />} label="Concept mastery" value={pct(data.kpis.masteryAvg)}
             hint={`${data.kpis.conceptsTracked} concepts tracked`} accent="from-emerald-500/15 to-emerald-500/5" />
        <Kpi
          icon={data.kpis.trendDelta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          label="Trend"
          value={`${data.kpis.trendDelta >= 0 ? "+" : ""}${Math.round(data.kpis.trendDelta * 100)}%`}
          hint={data.kpis.trendDelta >= 0 ? "Improving" : "Needs focus"}
          accent={data.kpis.trendDelta >= 0 ? "from-emerald-500/15 to-emerald-500/5" : "from-destructive/15 to-destructive/5"}
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border bg-card p-6 elev-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Daily accuracy & activity</h3>
            <p className="text-xs text-muted-foreground">Rolling 30-day window</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-orange-500" /> {data.kpis.streak}-day streak
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline.map((d) => ({ ...d, accuracyPct: Math.round(d.accuracy * 100) }))}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                     tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
              <Area type="monotone" dataKey="accuracyPct" stroke="hsl(var(--primary))" fill="url(#g1)" name="Accuracy %" />
              <Area type="monotone" dataKey="minutes" stroke="hsl(var(--muted-foreground))" fillOpacity={0} name="Minutes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject radar */}
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <h3 className="font-display text-sm font-semibold">Subject-wise accuracy</h3>
          <p className="mb-4 text-xs text-muted-foreground">Mastery profile across active subjects</p>
          {radarData.length >= 3 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="accuracy" stroke="hsl(var(--primary))"
                         fill="hsl(var(--primary))" fillOpacity={0.35} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.subjectStats.length === 0 ? (
                <li className="text-sm text-muted-foreground">Attempt a few tests to populate subject breakdown.</li>
              ) : (
                data.subjectStats.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="font-mono">{pct(s.accuracy)}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* AI insights */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 elev-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">AI insights</h3>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keep practising — insights unlock with more activity.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {insights.map((i) => (
                <li key={i} className="flex gap-2"><ChevronRight className="text-primary mt-0.5 size-4 shrink-0" /> {i}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Weak areas */}
      <div className="rounded-2xl border bg-card p-6 elev-2">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <h3 className="font-display text-sm font-semibold">Weak areas to revisit</h3>
        </div>
        {data.weakAreas.length === 0 ? (
          <EmptyState title="No weak concepts" description="Every tracked concept is above 50% mastery — great job!" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.weakAreas.map((w, idx) => (
              <div key={idx} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{w.title}</div>
                  <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">
                    {pct(w.mastery)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-destructive" style={{ width: `${w.mastery * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {data.tagClusters.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {data.tagClusters.map((t) => (
              <span key={t.tag} className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
                {t.tag} <span className="text-muted-foreground">· {t.count}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <Link to="/student/recommendations" className="text-xs text-primary hover:underline">
            See AI recommendations →
          </Link>
          <Link to="/student/mastery" className="text-xs text-primary hover:underline">
            Open mastery dashboard →
          </Link>
        </div>
      </div>

      {/* Subject bar chart */}
      {data.subjectStats.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <h3 className="font-display text-sm font-semibold">Time invested by subject</h3>
          <p className="mb-4 text-xs text-muted-foreground">Minutes practised in the last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, hint, accent }: {
  icon: React.ReactNode; label: string; value: string; hint?: string; accent: string;
}) {
  return (
    <div className={`hover-lift rounded-2xl border bg-gradient-to-br ${accent} p-5 elev-2`}>
      <div className="text-primary mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
