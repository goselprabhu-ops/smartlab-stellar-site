import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Sparkles, Download, AlertTriangle, Info, Target, Clock, Brain, Flame,
} from "lucide-react";
import { listLinkedStudents } from "@/lib/progress.functions";
import { getChildAnalytics } from "@/lib/analytics.functions";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/parent/analytics")({
  head: () => ({ meta: [{ title: "Performance Analytics — Parent · Smart Lab Online" }] }),
  component: AnalyticsPage,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;

function AnalyticsPage() {
  const listFn = useServerFn(listLinkedStudents);
  const childFn = useServerFn(getChildAnalytics);
  const students = useQuery({ queryKey: ["linked-students"], queryFn: () => listFn() });
  const [activeId, setActiveId] = useState<string | null>(null);
  const studentId = activeId ?? students.data?.[0]?.user_id ?? null;
  const child = useQuery({
    queryKey: ["child-analytics", studentId],
    queryFn: () => childFn({ data: { studentId: studentId! } }),
    enabled: !!studentId,
  });

  const insights = useMemo(() => {
    if (!child.data) return [];
    const { kpis, subjectStats } = child.data;
    const out: string[] = [];
    if (kpis.trendDelta > 0.05) out.push(`Improving — accuracy up ${Math.round(kpis.trendDelta * 100)}% this month.`);
    if (kpis.trendDelta < -0.05) out.push(`Accuracy dropped ${Math.round(kpis.trendDelta * -100)}% — consider a check-in.`);
    if (kpis.streak === 0) out.push("No activity in the last few days — encourage a short session.");
    const weak = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy)[0];
    if (weak && weak.attempts >= 2 && weak.accuracy < 0.6)
      out.push(`Focus subject: ${weak.name} (${pct(weak.accuracy)}).`);
    const strong = [...subjectStats].sort((a, b) => b.accuracy - a.accuracy)[0];
    if (strong && strong.attempts >= 2) out.push(`Strongest area: ${strong.name} (${pct(strong.accuracy)}).`);
    return out.slice(0, 5);
  }, [child.data]);

  const downloadMonthly = () => {
    if (!child.data) return;
    const c = child.data;
    const rows = [
      "Monthly Report",
      `Generated,${new Date().toISOString().slice(0, 10)}`,
      `Attempts,${c.kpis.totalAttempts}`,
      `Accuracy,${pct(c.kpis.accuracy)}`,
      `Minutes,${c.kpis.totalMinutes}`,
      `Mastery,${pct(c.kpis.masteryAvg)}`,
      `Streak,${c.kpis.streak}`,
      "",
      "Subject,Attempts,Minutes,Accuracy",
      ...c.subjectStats.map((s) => `${s.name},${s.attempts},${s.minutes},${pct(s.accuracy)}`),
      "",
      "Date,Attempts,Minutes,Accuracy",
      ...c.timeline.map((d) => `${d.date},${d.attempts},${d.minutes},${pct(d.accuracy)}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (students.isLoading) return <LoadingState />;
  if (!students.data?.length)
    return (
      <EmptyState
        title="No linked students"
        description="Link a child from your settings to see their analytics here."
      />
    );

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Performance analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mastery, momentum, and AI insights for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
            {students.data.map((s) => (
              <button
                key={s.user_id}
                onClick={() => setActiveId(s.user_id)}
                className={`rounded-md px-3 py-1.5 text-sm transition-soft ${
                  studentId === s.user_id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {s.full_name ?? "Student"}
              </button>
            ))}
          </div>
          <Button onClick={downloadMonthly} variant="outline" size="sm" className="gap-2" disabled={!child.data}>
            <Download className="size-4" /> Monthly report
          </Button>
        </div>
      </div>

      {child.isLoading || !child.data ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={<Target className="size-4" />} label="Accuracy" value={pct(child.data.kpis.accuracy)}
                 hint={`${child.data.kpis.totalAttempts} attempts`} />
            <Kpi icon={<Clock className="size-4" />} label="Time studied" value={`${child.data.kpis.totalMinutes} min`}
                 hint={`Streak: ${child.data.kpis.streak} days`} />
            <Kpi icon={<Brain className="size-4" />} label="Mastery" value={pct(child.data.kpis.masteryAvg)}
                 hint={`${child.data.kpis.conceptsTracked} concepts`} />
            <Kpi
              icon={child.data.kpis.trendDelta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              label="Trend"
              value={`${child.data.kpis.trendDelta >= 0 ? "+" : ""}${Math.round(child.data.kpis.trendDelta * 100)}%`}
              hint={child.data.kpis.trendDelta >= 0 ? "Improving" : "Needs focus"}
            />
          </div>

          {/* Alerts */}
          {child.data.alerts.length > 0 && (
            <div className="space-y-2">
              {child.data.alerts.map((a, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                    a.level === "critical"
                      ? "border-destructive/40 bg-destructive/5 text-destructive"
                      : a.level === "warn"
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                      : "border-primary/30 bg-primary/5 text-primary"
                  }`}
                >
                  {a.level === "info" ? <Info className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
              <h3 className="font-display text-sm font-semibold">Daily accuracy</h3>
              <p className="mb-4 text-xs text-muted-foreground">Last 30 days</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={child.data.timeline.map((d) => ({ ...d, accuracyPct: Math.round(d.accuracy * 100) }))}>
                    <defs>
                      <linearGradient id="parentG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="accuracyPct" stroke="hsl(var(--primary))" fill="url(#parentG)" name="Accuracy %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 elev-2">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="text-primary size-4" />
                <h3 className="font-display text-sm font-semibold">AI insights</h3>
              </div>
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Insights will appear as your child practises more.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {insights.map((i) => <li key={i}>· {i}</li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 elev-2">
            <h3 className="font-display text-sm font-semibold">Subject performance</h3>
            <p className="mb-4 text-xs text-muted-foreground">Accuracy and time invested per subject</p>
            {child.data.subjectStats.length === 0 ? (
              <EmptyState title="No subject data" description="Your child hasn't completed subject-tagged tests yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={child.data.subjectStats.map((s) => ({ ...s, accuracyPct: Math.round(s.accuracy * 100) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Bar dataKey="accuracyPct" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Accuracy %" />
                    <Bar dataKey="minutes" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <div className="text-primary mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
