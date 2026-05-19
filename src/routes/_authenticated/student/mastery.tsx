import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLearningIntelligence } from "@/lib/mastery-analytics.functions";
import { getMasteryHeatmap } from "@/lib/knowledge-graph.functions";
import {
  Brain,
  Target,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/mastery")({
  component: MasteryDashboard,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;

function masteryColor(m: number) {
  if (m >= 0.85) return "bg-emerald-500";
  if (m >= 0.6) return "bg-primary";
  if (m >= 0.35) return "bg-amber-500";
  return "bg-destructive";
}
function masteryTint(m: number) {
  if (m >= 0.85) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  if (m >= 0.6) return "bg-primary/10 text-primary border-primary/30";
  if (m >= 0.35) return "bg-amber-500/10 text-amber-600 border-amber-500/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

function MasteryDashboard() {
  const intel = useServerFn(getLearningIntelligence);
  const heat = useServerFn(getMasteryHeatmap);
  const i = useQuery({ queryKey: ["intel"], queryFn: () => intel() });
  const h = useQuery({ queryKey: ["heatmap"], queryFn: () => heat({ data: {} }) });

  if (i.isLoading || !i.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading learning intelligence…
      </div>
    );
  }

  const { summary, bands, clusters, trend, topStrengths, topWeak, weaknesses } = i.data;
  const empty = summary.trackedConcepts === 0;

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Learning Intelligence
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Concept mastery</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scientific tracking at the micro-concept level — mastery, recall, evaluation, confidence,
          retention, and weakness patterns.
        </p>
      </header>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-semibold">No mastery data yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete one adaptive learning loop to populate your dashboard.
          </p>
          <Link
            to="/student/recommendations"
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Find a concept to study
          </Link>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI label="Avg mastery" value={pct(summary.avgMastery)} icon={Trophy} accent={masteryColor(summary.avgMastery)} />
            <KPI label="Confidence" value={pct(summary.avgConfidence)} icon={Sparkles} />
            <KPI label="Retention" value={pct(summary.retention)} icon={Flame} sub={`${summary.dueSoon} due for review`} />
            <KPI label="Study time" value={`${summary.totalMinutes}m`} icon={Clock} sub={`${summary.trackedConcepts} concepts tracked`} />
          </section>

          {/* Bands + Trend */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-base font-semibold">Mastery bands</h3>
              <div className="mt-4 space-y-3">
                {[
                  { k: "mastered", label: "Mastered", v: bands.mastered, m: 0.9 },
                  { k: "proficient", label: "Proficient", v: bands.proficient, m: 0.7 },
                  { k: "developing", label: "Developing", v: bands.developing, m: 0.45 },
                  { k: "weak", label: "Weak", v: bands.weak, m: 0.2 },
                ].map((b) => {
                  const total = bands.mastered + bands.proficient + bands.developing + bands.weak || 1;
                  const w = (b.v / total) * 100;
                  return (
                    <div key={b.k}>
                      <div className="flex justify-between text-xs">
                        <span>{b.label}</span>
                        <span className="tabular-nums text-muted-foreground">{b.v}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${masteryColor(b.m)}`} style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
              <h3 className="font-display text-base font-semibold">Recent performance trend</h3>
              <p className="text-xs text-muted-foreground">Last {trend.length} recall + evaluation samples</p>
              <TrendSpark data={trend} />
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span><span className="inline-block h-2 w-2 rounded-full bg-primary" /> Sample score</span>
                <span><TrendingUp className="inline h-3 w-3" /> Smoothed mastery: {pct(summary.avgMastery)}</span>
              </div>
            </div>
          </section>

          {/* Heatmap */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold">Subject × Chapter heatmap</h3>
            {h.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (h.data?.subjects ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No subjects tracked yet.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {h.data!.subjects.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-baseline justify-between">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs tabular-nums text-muted-foreground">{pct(s.avgMastery)}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {s.chapters.map((c) => (
                        <div
                          key={c.id}
                          title={`${c.title} • ${pct(c.avgMastery)} • ${c.tracked} concepts`}
                          className={`rounded-lg border p-3 text-xs ${masteryTint(c.avgMastery)}`}
                        >
                          <div className="line-clamp-2 font-medium">{c.title}</div>
                          <div className="mt-1 tabular-nums opacity-80">{pct(c.avgMastery)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Strengths / Weaknesses / Clusters */}
          <section className="grid gap-6 lg:grid-cols-3">
            <ListCard title="Top strengths" icon={Trophy} items={topStrengths} accent="emerald" />
            <ListCard title="Focus areas" icon={AlertTriangle} items={topWeak} accent="destructive" />
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-base font-semibold">Weakness clusters</h3>
              <p className="text-xs text-muted-foreground">Recurring sub-skill gaps across concepts</p>
              {clusters.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No clusters yet — complete a few loops.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {clusters.map((c) => (
                    <span
                      key={c.tag}
                      className="rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs text-destructive"
                      style={{ fontSize: `${Math.min(14, 11 + c.count)}px` }}
                    >
                      {c.tag} · {c.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {weaknesses.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-base font-semibold">AI insights</h3>
              <ul className="mt-4 space-y-3">
                {weaknesses.map((w) => (
                  <li key={w.microConceptId} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to="/student/learn/$microConceptId"
                        params={{ microConceptId: w.microConceptId }}
                        className="font-medium hover:underline"
                      >
                        {w.title}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {w.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                        ))}
                      </div>
                    </div>
                    {w.notes && <p className="mt-2 text-sm text-muted-foreground">{w.notes}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Brain;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
        {accent && <span className={`h-2 w-2 rounded-full ${accent}`} />}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: typeof Brain;
  items: Array<{ microConceptId: string; title: string; mastery: number; streak?: number }>;
  accent: "emerald" | "destructive";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent === "emerald" ? "text-emerald-600" : "text-destructive"}`} />
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li key={it.microConceptId} className="flex items-center justify-between gap-2">
              <Link
                to="/student/learn/$microConceptId"
                params={{ microConceptId: it.microConceptId }}
                className="truncate text-sm hover:underline"
              >
                {it.title}
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${masteryColor(it.mastery)}`} style={{ width: `${it.mastery * 100}%` }} />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                  {pct(it.mastery)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrendSpark({ data }: { data: Array<{ t: string; v: number }> }) {
  if (data.length === 0) {
    return <div className="mt-4 text-sm text-muted-foreground">Not enough data yet.</div>;
  }
  const W = 600;
  const H = 120;
  const pad = 8;
  const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => [pad + i * step, H - pad - d.v * (H - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-32 w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="text-primary">
        <path d={area} fill="url(#g1)" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}
