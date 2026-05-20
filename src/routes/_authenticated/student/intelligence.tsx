import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar, Legend,
} from "recharts";
import {
  Brain, Sparkles, TrendingUp, TrendingDown, Target, Flame, Clock, AlertTriangle,
  Trophy, Activity, Repeat, Compass, Loader2, ArrowRight, Gauge,
} from "lucide-react";
import { getIntelligenceAnalytics } from "@/lib/learning-intelligence.functions";

export const Route = createFileRoute("/_authenticated/student/intelligence")({
  head: () => ({ meta: [{ title: "Learning Intelligence · Smart Lab Online" }] }),
  component: IntelligencePage,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;
const pctNum = (x: number) => Math.round((x || 0) * 100);

function IntelligencePage() {
  const fn = useServerFn(getIntelligenceAnalytics);
  const [windowDays, setWindow] = useState<number>(30);
  const q = useQuery({
    queryKey: ["learning-intelligence", windowDays],
    queryFn: () => fn({ data: { windowDays, narrate: true } }),
  });

  const trendData = useMemo(
    () =>
      (q.data?.trend ?? []).map((b) => ({
        label: b.label,
        recall: pctNum(b.recallScore),
        accuracy: pctNum(b.evalAccuracy),
        minutes: b.minutes,
        sessions: b.sessions,
      })),
    [q.data],
  );
  const bandData = useMemo(
    () =>
      q.data
        ? [
            { name: "Mastered", value: q.data.bands.mastered, fill: "hsl(var(--primary))" },
            { name: "Proficient", value: q.data.bands.proficient, fill: "hsl(var(--accent))" },
            { name: "Developing", value: q.data.bands.developing, fill: "hsl(38 92% 50%)" },
            { name: "Weak", value: q.data.bands.weak, fill: "hsl(var(--destructive))" },
          ]
        : [],
    [q.data],
  );

  if (q.isLoading || !q.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading learning intelligence…
      </div>
    );
  }

  const d = q.data;
  const s = d.summary;

  return (
    <section className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary font-display text-xs font-medium uppercase tracking-[0.2em]">
            Learning Intelligence
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your adaptive brain</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tracks 8 signals across {s.trackedConcepts} concepts · updated {new Date(d.generatedAt).toLocaleTimeString()}.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {[7, 14, 30, 60].map((w) => (
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
      </header>

      {/* AI narrative */}
      {d.narrative && (
        <div className="from-primary/10 rounded-2xl border bg-gradient-to-br to-transparent p-5 elev-2">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">AI summary</h3>
          </div>
          <p className="text-sm leading-relaxed">{d.narrative}</p>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Brain className="size-4" />} label="Avg mastery" value={pct(s.avgMastery)}
             hint={`${s.trackedConcepts} concepts tracked`} />
        <Kpi icon={<Gauge className="size-4" />} label="7d retention" value={pct(s.avgRetention7d)}
             hint={`${s.atRisk} at risk · ${s.criticalRisk} critical`}
             tone={s.atRisk > 3 ? "warn" : "default"} />
        <Kpi icon={<Activity className="size-4" />} label="Recall strength" value={pct(s.avgRecall)}
             hint={d.recallMA.delta >= 0 ? `+${pct(d.recallMA.delta)} vs prior` : `${pct(d.recallMA.delta)} vs prior`} />
        <Kpi icon={<Flame className="size-4" />} label="Streak" value={`${s.streak}d`}
             hint={`${s.activeDays} active in ${windowDays}d · ${pct(s.consistency)} consistency`} />
      </div>

      {/* Insights */}
      {d.insights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.insights.map((i, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                i.kind === "win"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : i.kind === "risk"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              {i.kind === "win" ? (
                <Trophy className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : i.kind === "risk" ? (
                <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
              ) : (
                <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />
              )}
              <span>{i.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <div className="rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold">Recall & accuracy trend</h3>
              <p className="text-muted-foreground text-xs">Rolling {windowDays}-day signal</p>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <Legend />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Area type="monotone" dataKey="recall" stroke="hsl(var(--primary))" fill="url(#g1)" name="Recall %" />
                <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" fill="url(#g2)" name="Accuracy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mastery bands */}
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <h3 className="font-display mb-3 text-sm font-semibold">Mastery distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart data={bandData} innerRadius="30%" outerRadius="100%">
                <RadialBar dataKey="value" background />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {bandData.map((b) => (
              <div key={b.name} className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-sm" style={{ background: b.fill }} />
                <span>{b.name}</span>
                <span className="text-muted-foreground ml-auto">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Predictions */}
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <h3 className="font-display mb-1 text-sm font-semibold">Next-week predictions</h3>
          <p className="text-muted-foreground mb-4 text-xs">Forecast from current trends</p>
          <div className="space-y-4">
            <Predict label="Predicted mastery" value={d.predictions.nextWeekMastery} base={s.avgMastery} />
            <Predict label="Predicted retention (7d)" value={d.predictions.nextWeekRetention} base={s.avgRetention7d} />
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Confidence level</span>
              <span className="font-medium capitalize">{d.predictions.confidenceLevel}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Mastery momentum</span>
              <span className={`flex items-center gap-1 font-medium ${d.predictions.masteryTrend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {d.predictions.masteryTrend >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {d.predictions.masteryTrend >= 0 ? "+" : ""}{pct(d.predictions.masteryTrend)}
              </span>
            </div>
          </div>
        </div>

        {/* Revision effectiveness */}
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <div className="mb-3 flex items-center gap-2">
            <Repeat className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">Revision effectiveness</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Sessions" value={String(d.revisionEffectiveness.sessionsWithRevisits)} />
            <Stat label="Avg gain" value={pct(d.revisionEffectiveness.avgGain)} />
            <Stat label="Success" value={pct(d.revisionEffectiveness.successRate)} />
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            How much your recall improves between first and last attempt within the same session.
          </p>
          <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs">
            <div className="flex justify-between"><span>Time efficiency</span><span>{Math.round(s.minutesPerPercent)} min / 1% mastery</span></div>
            <div className="mt-1 flex justify-between"><span>Sessions ({windowDays}d)</span><span>{s.sessionsCount}</span></div>
            <div className="mt-1 flex justify-between"><span>Quiz attempts ({windowDays}d)</span><span>{s.attemptsCount}</span></div>
          </div>
        </div>
      </div>

      {/* Weakness trends */}
      <div className="rounded-2xl border bg-card p-6 elev-2">
        <h3 className="font-display mb-1 text-sm font-semibold">Weakness trends</h3>
        <p className="text-muted-foreground mb-4 text-xs">Top recurring tags across recent sessions</p>
        {d.clusters.length === 0 ? (
          <p className="text-muted-foreground text-sm">No weakness signals yet — keep practising.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d.clusters.slice(0, 8).map((c) => ({ tag: c.tag, severity: Math.round((c as any).severity ? (c as any).severity * 100 : c.count * 10), count: c.count }))}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="tag" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  <Bar dataKey="severity" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} name="Severity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="label" allowDuplicatedCategory={false} type="category" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  {d.tagSeries.map((s, idx) => (
                    <Line
                      key={s.tag}
                      data={s.points}
                      dataKey="count"
                      name={s.tag}
                      type="monotone"
                      stroke={`hsl(${(idx * 67) % 360} 70% 55%)`}
                      dot={false}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming reviews + recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 elev-2">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">Upcoming reviews</h3>
          </div>
          {d.upcomingReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing due — great job staying on top of it.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.upcomingReviews.map((r) => (
                <li key={r.microConceptId} className="flex items-center justify-between rounded-lg border bg-card/60 p-3">
                  <div className="min-w-0">
                    <Link to="/student/learn/$microConceptId" params={{ microConceptId: r.microConceptId }} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      Retention {pct(r.r7d)} · mastery {pct(r.mastery)}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
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
            <h3 className="font-display text-sm font-semibold">Recommended next</h3>
          </div>
          {d.recommendations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Recommendations will appear after a few sessions.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.recommendations.map((r) => (
                <li key={r.microConceptId} className="rounded-lg border bg-card/60 p-3">
                  <div className="flex items-center justify-between">
                    <Link to="/student/learn/$microConceptId" params={{ microConceptId: r.microConceptId }} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      {pctNum(r.priority)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{r.reason}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>~{r.estimatedMinutes} min</span>
                    <Link to="/student/learn/$microConceptId" params={{ microConceptId: r.microConceptId }} className="text-primary inline-flex items-center gap-1 hover:underline">
                      Start <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Kpi({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: "default" | "warn" }) {
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <div className={`mb-2 flex items-center gap-2 text-xs uppercase tracking-wide ${tone === "warn" ? "text-amber-600" : "text-primary"}`}>
        {icon} {label}
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className="font-display mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function Predict({ label, value, base }: { label: string; value: number; base: number }) {
  const delta = value - base;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{pct(delta)}
        </span>
      </div>
      <div className="bg-muted/40 h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full" style={{ width: `${pctNum(value)}%` }} />
      </div>
      <div className="text-muted-foreground text-xs">Now {pct(base)} → {pct(value)}</div>
    </div>
  );
}
