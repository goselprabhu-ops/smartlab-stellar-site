import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Sparkles, Download, AlertTriangle, Info, Brain, Trophy, TrendingUp, TrendingDown,
  Gauge, Activity, Clock, Compass,
} from "lucide-react";
import { listLinkedStudents } from "@/lib/progress.functions";
import { getParentIntelligenceReport } from "@/lib/learning-intelligence.functions";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/parent/intelligence")({
  head: () => ({ meta: [{ title: "Learning Intelligence — Parent · Smart Lab Online" }] }),
  component: ParentIntelligencePage,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;
const pctNum = (x: number) => Math.round((x || 0) * 100);

function ParentIntelligencePage() {
  const listFn = useServerFn(listLinkedStudents);
  const reportFn = useServerFn(getParentIntelligenceReport);
  const students = useQuery({ queryKey: ["linked-students"], queryFn: () => listFn() });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [windowDays, setWindow] = useState<number>(30);
  const studentId = activeId ?? students.data?.[0]?.user_id ?? null;
  const report = useQuery({
    queryKey: ["parent-intel", studentId, windowDays],
    queryFn: () => reportFn({ data: { studentId: studentId!, windowDays, narrate: true } }),
    enabled: !!studentId,
  });

  const download = () => {
    if (!report.data) return;
    const d = report.data;
    const lines = [
      "Learning Intelligence Report",
      `Generated,${new Date().toISOString().slice(0, 10)}`,
      `Window,${windowDays} days`,
      "",
      "KPI,Value",
      `Avg mastery,${pct(d.summary.avgMastery)}`,
      `Avg confidence,${pct(d.summary.avgConfidence)}`,
      `Recall strength,${pct(d.summary.avgRecall)}`,
      `Retention 7d,${pct(d.summary.avgRetention7d)}`,
      `Retention 30d,${pct(d.summary.avgRetention30d)}`,
      `Concepts at risk,${d.summary.atRisk}`,
      `Critical risk,${d.summary.criticalRisk}`,
      `Active days,${d.summary.activeDays}/${windowDays}`,
      `Streak,${d.summary.streak} days`,
      `Total minutes,${d.summary.totalMinutes}`,
      "",
      "Predictions",
      `Next-week mastery,${pct(d.predictions.nextWeekMastery)}`,
      `Next-week retention,${pct(d.predictions.nextWeekRetention)}`,
      `Mastery momentum,${pct(d.predictions.masteryTrend)}`,
      `Confidence level,${d.predictions.confidenceLevel}`,
      "",
      "Insights",
      ...d.insights.map((i) => `${i.kind},${i.message}`),
      "",
      "Recommendations",
      ...d.recommendations.map((r) => `${r.title},${r.reason},${r.estimatedMinutes} min`),
      "",
      "Date,Recall %,Accuracy %,Minutes",
      ...d.trend.map((t) => `${t.label},${pctNum(t.recallScore)},${pctNum(t.evalAccuracy)},${t.minutes}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `intelligence-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (students.isLoading) return <LoadingState />;
  if (!students.data?.length)
    return <EmptyState title="No linked students" description="Link a child to view their learning intelligence." />;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Learning intelligence</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Mastery, retention, predictions, and AI-generated insights for your child.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <div className="flex gap-1 rounded-lg border bg-card p-1">
            {[14, 30, 60].map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`rounded-md px-3 py-1.5 text-sm transition-soft ${
                  windowDays === w ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
          <Button onClick={download} variant="outline" size="sm" className="gap-2" disabled={!report.data}>
            <Download className="size-4" /> Report
          </Button>
        </div>
      </div>

      {report.isLoading || !report.data ? (
        <LoadingState />
      ) : (
        <>
          {report.data.parentNarrative && (
            <div className="from-primary/10 rounded-2xl border bg-gradient-to-br to-transparent p-5 elev-2">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="text-primary size-4" />
                <h3 className="font-display text-sm font-semibold">Weekly AI summary</h3>
              </div>
              <p className="text-sm leading-relaxed">{report.data.parentNarrative}</p>
            </div>
          )}

          {report.data.alerts.length > 0 && (
            <div className="space-y-2">
              {report.data.alerts.map((a, idx) => (
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={<Brain className="size-4" />} label="Avg mastery" value={pct(report.data.summary.avgMastery)}
                 hint={`${report.data.summary.trackedConcepts} concepts`} />
            <Kpi icon={<Gauge className="size-4" />} label="Retention (7d)" value={pct(report.data.summary.avgRetention7d)}
                 hint={`${report.data.summary.atRisk} at risk`} />
            <Kpi icon={<Activity className="size-4" />} label="Recall" value={pct(report.data.summary.avgRecall)}
                 hint={`${report.data.summary.streak}-day streak`} />
            <Kpi
              icon={report.data.predictions.masteryTrend >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              label="Momentum"
              value={`${report.data.predictions.masteryTrend >= 0 ? "+" : ""}${pct(report.data.predictions.masteryTrend)}`}
              hint={report.data.predictions.confidenceLevel + " confidence"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
              <h3 className="font-display text-sm font-semibold">Recall & accuracy trend</h3>
              <p className="text-muted-foreground mb-4 text-xs">Last {windowDays} days</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.data.trend.map((t) => ({ label: t.label, recall: pctNum(t.recallScore), accuracy: pctNum(t.evalAccuracy) }))}>
                    <defs>
                      <linearGradient id="pp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="recall" stroke="hsl(var(--primary))" fill="url(#pp)" name="Recall %" />
                    <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" name="Accuracy %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 elev-2">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="text-primary size-4" />
                <h3 className="font-display text-sm font-semibold">Insights</h3>
              </div>
              {report.data.insights.length === 0 ? (
                <p className="text-muted-foreground text-sm">More insights appear as your child practises.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {report.data.insights.slice(0, 6).map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-1 inline-block size-1.5 rounded-full ${
                        i.kind === "win" ? "bg-emerald-500" : i.kind === "risk" ? "bg-destructive" : "bg-primary"
                      }`} />
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 elev-2">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="text-primary size-4" />
                <h3 className="font-display text-sm font-semibold">Upcoming reviews</h3>
              </div>
              {report.data.upcomingReviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">Everything is on schedule.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {report.data.upcomingReviews.slice(0, 6).map((r) => (
                    <li key={r.microConceptId} className="flex items-center justify-between rounded-lg border bg-card/60 p-3">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-muted-foreground text-xs">Retention {pct(r.r7d)}</div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(r.reviewAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-6 elev-2">
              <div className="mb-3 flex items-center gap-2">
                <Compass className="text-primary size-4" />
                <h3 className="font-display text-sm font-semibold">Suggested focus</h3>
              </div>
              {report.data.recommendations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recommendations yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {report.data.recommendations.map((r) => (
                    <li key={r.microConceptId} className="rounded-lg border bg-card/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.title}</span>
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                          {pctNum(r.priority)}%
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{r.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </div>
  );
}
