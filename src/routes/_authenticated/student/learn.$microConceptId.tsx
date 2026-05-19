import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getEngineState, restudy } from "@/lib/engine.functions";
import {
  scoreRecollection,
  recordEvaluation,
  analyseWeakness,
  generateRemediation,
} from "@/lib/learning-loop.functions";
import { nextMicroConcept } from "@/lib/learning-loop.functions";
import { updateConceptMastery } from "@/lib/knowledge-graph.functions";
import { Brain, BookOpen, PencilLine, ClipboardCheck, Activity, Sparkles, Trophy, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/learn/$microConceptId")({
  component: LearnPage,
});

type Phase = "study" | "recollect" | "evaluate" | "analyse" | "remediate" | "mastered";

const PHASE_META: Record<Phase, { label: string; Icon: typeof Brain }> = {
  study: { label: "Study", Icon: BookOpen },
  recollect: { label: "Recollect", Icon: PencilLine },
  evaluate: { label: "Evaluate", Icon: ClipboardCheck },
  analyse: { label: "Analyse", Icon: Activity },
  remediate: { label: "Personalized material", Icon: Sparkles },
  mastered: { label: "Mastered", Icon: Trophy },
};

function LearnPage() {
  const { microConceptId } = Route.useParams();
  const qc = useQueryClient();
  const getState = useServerFn(getEngineState);
  const { data, isLoading } = useQuery({
    queryKey: ["engine", microConceptId],
    queryFn: () => getState({ data: { microConceptId } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["engine", microConceptId] });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the engine…
      </div>
    );
  }

  const phase = data.phase as Phase;
  const mc = data.microConcept;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Adaptive Learning Engine
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">{mc.title}</h1>
        {mc.learning_objective && (
          <p className="mt-2 text-sm text-muted-foreground">{mc.learning_objective}</p>
        )}
        <PhaseStrip phase={phase} mastery={data.mastery?.mastery ?? data.session?.mastery ?? 0} />
      </header>

      {phase === "study" && <StudyCard mc={mc} microConceptId={microConceptId} onDone={refresh} />}
      {phase === "recollect" && <RecollectCard microConceptId={microConceptId} onDone={refresh} />}
      {phase === "evaluate" && <EvaluateCard microConceptId={microConceptId} onDone={refresh} />}
      {phase === "analyse" && <AnalyseCard microConceptId={microConceptId} onDone={refresh} />}
      {phase === "remediate" && (
        <RemediateCard
          microConceptId={microConceptId}
          material={data.material as any[]}
          weakness={data.weakness as any}
          onDone={refresh}
        />
      )}
      {phase === "mastered" && <MasteredCard />}
    </div>
  );
}

function PhaseStrip({ phase, mastery }: { phase: Phase; mastery: number }) {
  const order: Phase[] = ["study", "recollect", "evaluate", "analyse", "remediate", "mastered"];
  const activeIdx = order.indexOf(phase);
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {order.map((p, i) => {
          const Meta = PHASE_META[p];
          const active = i === activeIdx;
          const done = i < activeIdx || phase === "mastered";
          return (
            <div
              key={p}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-border bg-muted text-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              <Meta.Icon className="h-3.5 w-3.5" />
              {Meta.label}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.round(Number(mastery) * 100)}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(Number(mastery) * 100)}% mastery
        </span>
      </div>
    </div>
  );
}

function StudyCard({ mc, microConceptId, onDone }: { mc: any; microConceptId: string; onDone: () => void }) {
  const start = useServerFn(restudy); // also serves as "begin"
  const m = useMutation({
    mutationFn: () => start({ data: { microConceptId } }),
    onSuccess: onDone,
    onError: (e: any) => toast.error(e.message ?? "Failed to start"),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">Study</h2>
      <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-foreground">
        {mc.content_md || "(No canonical content yet — your tutor will generate one on first recall.)"}
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
        I'm ready to recall
      </button>
    </section>
  );
}

function RecollectCard({ microConceptId, onDone }: { microConceptId: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const fn = useServerFn(scoreRecollection);
  const m = useMutation({
    mutationFn: () => fn({ data: { microConceptId, response: text } }),
    onSuccess: (r) => {
      toast.success(`Recall score: ${Math.round((r.result.score ?? 0) * 100)}%`);
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to score"),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">Recollect</h2>
      <p className="mt-1 text-sm text-muted-foreground">Write everything you remember — no peeking.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Recall key ideas, definitions, formulas, examples…"
      />
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending || text.trim().length < 4}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Score my recall
      </button>
    </section>
  );
}

function EvaluateCard({ microConceptId, onDone }: { microConceptId: string; onDone: () => void }) {
  const [score, setScore] = useState(7);
  const [total] = useState(10);
  const fn = useServerFn(recordEvaluation);
  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          microConceptId,
          score,
          total,
          perQuestion: Array.from({ length: total }, (_, i) => ({
            questionId: `q${i + 1}`,
            correct: i < score,
          })),
        },
      }),
    onSuccess: onDone,
    onError: (e: any) => toast.error(e.message ?? "Failed to record"),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">Evaluate</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Quick adaptive check. (When chapter quizzes are wired, this auto-records.)
      </p>
      <div className="mt-4 flex items-center gap-4">
        <label className="text-sm">Score</label>
        <input
          type="range"
          min={0}
          max={total}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="flex-1"
        />
        <span className="tabular-nums text-sm">
          {score} / {total}
        </span>
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Submit & analyse
      </button>
    </section>
  );
}

function AnalyseCard({ microConceptId, onDone }: { microConceptId: string; onDone: () => void }) {
  const analyse = useServerFn(analyseWeakness);
  const generate = useServerFn(generateRemediation);
  const updateMastery = useServerFn(updateConceptMastery);
  const m = useMutation({
    mutationFn: async () => {
      const r = await analyse({ data: { microConceptId } });
      await updateMastery({ data: { microConceptId, sample: r.mastery } });
      if (!r.mastered) {
        await generate({ data: { microConceptId } });
      }
      return r;
    },
    onSuccess: (r) => {
      toast.success(r.mastered ? "Mastered ✨" : "Generating personalized material…");
      onDone();
    },
    onError: (e: any) => toast.error(e.message ?? "Analyse failed"),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">Analyse weakness</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fuse recall + evaluation signals → diagnose gaps → trigger targeted remediation.
      </p>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        Run AI analysis
      </button>
    </section>
  );
}

function RemediateCard({
  microConceptId,
  material,
  weakness,
  onDone,
}: {
  microConceptId: string;
  material: any[];
  weakness: any;
  onDone: () => void;
}) {
  const restart = useServerFn(restudy);
  const regen = useServerFn(generateRemediation);
  const m = useMutation({
    mutationFn: () => restart({ data: { microConceptId } }),
    onSuccess: onDone,
  });
  const r = useMutation({
    mutationFn: () => regen({ data: { microConceptId } }),
    onSuccess: onDone,
  });

  const reexplain = material.find((x) => x.kind === "reexplain")?.payload;
  const practice = material.find((x) => x.kind === "practice")?.payload?.items ?? [];
  const walks = material.find((x) => x.kind === "solution_walkthrough")?.payload?.items ?? [];

  return (
    <section className="space-y-4">
      {weakness?.weakness_tags?.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="text-xs uppercase tracking-wide text-destructive">Diagnosed weaknesses</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {weakness.weakness_tags.map((t: string) => (
              <span key={t} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                {t}
              </span>
            ))}
          </div>
          {weakness.notes && <p className="mt-2 text-sm text-foreground">{weakness.notes}</p>}
        </div>
      )}

      {reexplain && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Re-explanation</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reexplain.summary}</p>
          {reexplain.analogies?.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              {reexplain.analogies.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          )}
          {reexplain.workedExample && (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{reexplain.workedExample}</pre>
          )}
        </div>
      )}

      {practice.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Targeted practice</h3>
          <ol className="mt-3 space-y-3 text-sm">
            {practice.map((p: any, i: number) => (
              <li key={i} className="rounded-lg border border-border p-3">
                <div className="font-medium">{i + 1}. {p.prompt}</div>
                {p.options && (
                  <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                    {p.options.map((o: string, j: number) => <li key={j}>{o}</li>)}
                  </ul>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary">Show answer</summary>
                  <div className="mt-1 text-foreground">{p.answer}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.explanation}</div>
                </details>
              </li>
            ))}
          </ol>
        </div>
      )}

      {walks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Worked walkthroughs</h3>
          {walks.map((w: any, i: number) => (
            <div key={i} className="mt-3">
              <div className="text-sm font-medium">{w.question}</div>
              <ol className="mt-1 list-decimal pl-5 text-sm text-muted-foreground">
                {w.steps?.map((s: string, j: number) => <li key={j}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Restudy & try again
        </button>
        <button
          onClick={() => r.mutate()}
          disabled={r.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {r.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Regenerate material
        </button>
      </div>
    </section>
  );
}

function MasteredCard() {
  const next = useServerFn(nextMicroConcept);
  const { data } = useQuery({ queryKey: ["next-mc"], queryFn: () => next() });
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
      <Trophy className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-3 font-display text-2xl font-semibold">Mastered</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your recall and evaluation crossed mastery thresholds. The engine will resurface this concept
        on its decay schedule.
      </p>
      {data?.kind === "start" && (
        <Link
          to="/student/learn/$microConceptId"
          params={{ microConceptId: data.microConceptId }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Next: {data.title} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
