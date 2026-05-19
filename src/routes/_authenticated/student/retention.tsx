import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Brain,
  Clock,
  Flame,
  Loader2,
  Sparkles,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  generateAiRevisionPlan,
  getRetentionAnalytics,
} from "@/lib/retention.functions";

export const Route = createFileRoute("/_authenticated/student/retention")({
  component: RetentionPage,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;
const days = (x: number) =>
  x < 1 ? `${Math.max(1, Math.round(x * 24))}h` : `${Math.round(x)}d`;

function bucketTint(b: string) {
  switch (b) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "weak":
      return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    case "fading":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  }
}

function heatColor(retention: number) {
  // retention 0..1 → red → amber → emerald
  if (retention >= 0.85) return "bg-emerald-500";
  if (retention >= 0.7) return "bg-emerald-400";
  if (retention >= 0.55) return "bg-amber-400";
  if (retention >= 0.35) return "bg-orange-500";
  return "bg-destructive";
}

function RetentionPage() {
  const fetchAnalytics = useServerFn(getRetentionAnalytics);
  const aiPlan = useServerFn(generateAiRevisionPlan);
  const qc = useQueryClient();
  const [minutes, setMinutes] = useState(25);

  const a = useQuery({
    queryKey: ["retention-analytics"],
    queryFn: () => fetchAnalytics(),
  });

  const plan = useMutation({
    mutationFn: () => aiPlan({ data: { minutes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retention-analytics"] }),
  });

  if (a.isLoading || !a.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading retention engine…
      </div>
    );
  }

  const { summary, buckets, items, forecast, todayPlan } = a.data;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Brain className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest">Retention Engine</span>
        </div>
        <h1 className="text-3xl font-semibold">AI Revision Planner</h1>
        <p className="text-muted-foreground max-w-2xl">
          Forgetting-curve modeling, spaced repetition, and memory-strength
          scoring across every micro-concept you have studied.
        </p>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          icon={<Brain className="h-4 w-4" />}
          label="Memory Strength"
          value={pct(summary.avgMemoryStrength)}
          hint={`${summary.total} tracked concepts`}
        />
        <Kpi
          icon={<TrendingDown className="h-4 w-4" />}
          label="Avg Forget Risk"
          value={pct(summary.avgForgetProbability)}
          hint={`Stability ${days(summary.avgStabilityDays)}`}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label="Due Now"
          value={String(summary.dueNow)}
          hint={`${summary.dueIn24h} in 24h · ${summary.dueIn7d} this week`}
        />
        <Kpi
          icon={<Flame className="h-4 w-4" />}
          label="Recent Recall"
          value={summary.recentRecallAvg == null ? "—" : pct(summary.recentRecallAvg)}
          hint="Rolling 10-attempt average"
        />
      </section>

      {/* Memory bucket distribution */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Bucket label="Critical" count={buckets.critical} tone="bg-destructive" />
        <Bucket label="Weak" count={buckets.weak} tone="bg-amber-500" />
        <Bucket label="Fading" count={buckets.fading} tone="bg-primary" />
        <Bucket label="Stable" count={buckets.stable} tone="bg-emerald-500" />
      </section>

      {/* AI revision planner */}
      <section className="border rounded-2xl p-6 bg-card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">AI Revision Planner</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Generate today's optimized revision schedule. Reinforces low-confidence
              areas first and reintroduces fading concepts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              Budget
              <input
                type="number"
                min={5}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 25)}
                className="w-20 bg-background border rounded-md px-2 py-1 text-sm"
              />
              min
            </label>
            <button
              onClick={() => plan.mutate()}
              disabled={plan.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {plan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Generate plan
            </button>
          </div>
        </div>

        {plan.data && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
              {plan.data.rationale}
            </p>
            <ol className="space-y-2">
              {plan.data.plan
                ?.sort((x, y) => x.order - y.order)
                .map((p) => {
                  const it = items.find((i) => i.microConceptId === p.microConceptId);
                  return (
                    <li
                      key={p.microConceptId}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                    >
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {p.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to="/student/learn/$microConceptId"
                            params={{ microConceptId: p.microConceptId }}
                            className="font-medium hover:text-primary truncate"
                          >
                            {it?.title ?? "Concept"}
                          </Link>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {p.suggestedMinutes}m · next in {days(p.nextReviewInDays)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.reason}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </div>
        )}

        {!plan.data && todayPlan.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Smart reminders (heuristic)
            </h3>
            <ul className="space-y-2">
              {todayPlan.map((i) => (
                <li
                  key={i.microConceptId}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background"
                >
                  <div className="min-w-0">
                    <Link
                      to="/student/learn/$microConceptId"
                      params={{ microConceptId: i.microConceptId }}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {i.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Forget risk {pct(i.forgetProb)} · {i.estimatedMinutes}m
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${bucketTint(i.bucket)}`}
                  >
                    {i.bucket}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Forecast heatmap */}
      <section className="border rounded-2xl p-6 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">14-Day Retention Forecast</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Predicted average recall if you skipped all revision. Darker = stronger memory.
        </p>
        <div className="grid grid-cols-7 md:grid-cols-14 gap-1.5">
          {forecast.map((f) => (
            <div key={f.day} className="flex flex-col items-center gap-1">
              <div
                className={`h-12 w-full rounded ${heatColor(f.avgRetention)}`}
                title={`Day +${f.day}: ${pct(f.avgRetention)} retention, ${f.atRisk} at risk`}
              />
              <span className="text-[10px] text-muted-foreground">
                +{f.day}d
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Weakest</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.75, 0.9].map((r) => (
              <span key={r} className={`h-3 w-6 rounded ${heatColor(r)}`} />
            ))}
          </div>
          <span>Strongest</span>
        </div>
      </section>

      {/* Memory heatmap by concept */}
      <section className="border rounded-2xl p-6 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Memory Heatmap by Concept</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Every tracked micro-concept, ranked by forget probability.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.slice(0, 60).map((i) => (
            <Link
              key={i.microConceptId}
              to="/student/learn/$microConceptId"
              params={{ microConceptId: i.microConceptId }}
              className="p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium truncate">{i.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${bucketTint(i.bucket)}`}
                >
                  {i.bucket}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={heatColor(i.retrievability)}
                  style={{
                    width: `${Math.max(4, Math.round(i.retrievability * 100))}%`,
                    height: "100%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                <span>Memory {pct(i.memoryStrength)}</span>
                <span>Stab {days(i.stability)}</span>
                <span>Forget {pct(i.forgetProb)}</span>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No concepts tracked yet. Start a learning session to populate the planner.
          </p>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Bucket({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="border rounded-xl p-4 bg-card flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="text-2xl font-semibold">{count}</div>
      </div>
      <span className={`h-10 w-2 rounded-full ${tone}`} />
    </div>
  );
}
