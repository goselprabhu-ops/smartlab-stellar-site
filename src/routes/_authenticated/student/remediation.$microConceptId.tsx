import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getRemediationPack, runRemediationPipeline } from "@/lib/remediation.functions";
import {
  Sparkles,
  FileText,
  StickyNote,
  Layers,
  ClipboardCheck,
  BookOpen,
  Timer,
  Image as ImageIcon,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/remediation/$microConceptId")({
  component: RemediationPage,
});

function RemediationPage() {
  const { microConceptId } = Route.useParams();
  const qc = useQueryClient();
  const fetchPack = useServerFn(getRemediationPack);
  const runPipeline = useServerFn(runRemediationPipeline);

  const { data, isLoading } = useQuery({
    queryKey: ["remediation", microConceptId],
    queryFn: () => fetchPack({ data: { microConceptId } }),
  });

  const gen = useMutation({
    mutationFn: () => runPipeline({ data: { microConceptId } }),
    onSuccess: () => {
      toast.success("Personalized pack generated");
      qc.invalidateQueries({ queryKey: ["remediation", microConceptId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Generation failed"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  // Pick latest of each kind
  const byKind = new Map<string, any>();
  for (const it of data.items as any[]) {
    if (!byKind.has(it.kind)) byKind.set(it.kind, it);
  }
  const notes = byKind.get("simplified_notes")?.payload;
  const summary = byKind.get("summary")?.payload;
  const flashcards = byKind.get("flashcards")?.payload?.items as any[] | undefined;
  const mcqs = byKind.get("mcq")?.payload?.items as any[] | undefined;
  const sheet = byKind.get("revision_sheet")?.payload?.markdown as string | undefined;
  const microTest = byKind.get("micro_test")?.payload;
  const visual = byKind.get("visual_explanation")?.payload;

  const hasAny = byKind.size > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> AI Remediation Engine
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">{data.microConcept?.title}</h1>
            {data.microConcept?.learning_objective && (
              <p className="mt-1 text-sm text-muted-foreground">{data.microConcept.learning_objective}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              to="/student/learn/$microConceptId"
              params={{ microConceptId }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
            >
              <ArrowRight className="h-4 w-4" /> Back to engine
            </Link>
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {hasAny ? "Regenerate pack" : "Generate pack"}
            </button>
          </div>
        </div>
      </header>

      {!hasAny ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-semibold">No remediation pack yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run the pipeline to generate simplified notes, flashcards, MCQs, a revision sheet, a
            micro test, and a visual explanation tailored to your diagnosed weaknesses.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {summary && (
            <Card icon={FileText} title="Concept summary">
              <p className="text-sm">{summary.paragraph}</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                {summary.bullets?.map((b: string, i: number) => <li key={i}>{b}</li>)}
              </ul>
            </Card>
          )}

          {notes?.text && (
            <Card icon={StickyNote} title="Simplified notes">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{notes.text}</div>
            </Card>
          )}

          {flashcards && flashcards.length > 0 && (
            <Card icon={Layers} title={`Flashcards (${flashcards.length})`}>
              <Flashdeck cards={flashcards} />
            </Card>
          )}

          {mcqs && mcqs.length > 0 && (
            <Card icon={ClipboardCheck} title={`Practice MCQs (${mcqs.length})`}>
              <McqList items={mcqs} />
            </Card>
          )}

          {sheet && (
            <Card icon={BookOpen} title="Revision sheet">
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">{sheet}</pre>
            </Card>
          )}

          {microTest && (
            <Card icon={Timer} title={`Micro test · ${microTest.durationMinutes ?? 5} min`}>
              <ol className="space-y-2 text-sm">
                {microTest.items?.map((it: any, i: number) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <div className="font-medium">{i + 1}. {it.prompt}</div>
                    {it.options && (
                      <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                        {it.options.map((o: string, j: number) => <li key={j}>{o}</li>)}
                      </ul>
                    )}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-primary">Show answer</summary>
                      <div className="mt-1 text-foreground">{it.answer}</div>
                    </details>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {visual && (
            <Card icon={ImageIcon} title="Visual explanation">
              <p className="text-sm">{visual.description}</p>
              {visual.asciiOrMermaid && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{visual.asciiOrMermaid}</pre>
              )}
              {visual.imagePrompt && (
                <div className="mt-3 rounded-lg border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Image prompt:</span> {visual.imagePrompt}
                </div>
              )}
            </Card>
          )}

          {(data.related ?? []).length > 0 && (
            <Card icon={ArrowRight} title="Related concepts to reinforce">
              <ul className="grid gap-2 sm:grid-cols-2">
                {(data.related ?? []).map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/student/learn/$microConceptId"
                      params={{ microConceptId: r.id }}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary"
                    >
                      <span>{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.relation}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Flashdeck({ cards }: { cards: Array<{ front: string; back: string; hint?: string }> }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const c = cards[idx];
  return (
    <div>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-32 cursor-pointer items-center justify-center rounded-xl border border-border bg-background p-6 text-center text-sm"
      >
        {flipped ? <span>{c.back}</span> : <span className="font-medium">{c.front}</span>}
      </div>
      {c.hint && !flipped && <p className="mt-2 text-center text-xs text-muted-foreground">Hint: {c.hint}</p>}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => {
            setIdx((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          disabled={idx === 0}
          className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-xs text-muted-foreground">
          {idx + 1} / {cards.length}
        </span>
        <button
          onClick={() => {
            setIdx((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          disabled={idx === cards.length - 1}
          className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function McqList({
  items,
}: {
  items: Array<{ prompt: string; options: string[]; correctIndex: number; explanation: string }>;
}) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  return (
    <ol className="space-y-4 text-sm">
      {items.map((q, i) => {
        const pick = picks[i];
        const answered = pick !== undefined;
        return (
          <li key={i} className="rounded-xl border border-border p-4">
            <div className="font-medium">{i + 1}. {q.prompt}</div>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, j) => {
                const isCorrect = j === q.correctIndex;
                const isPick = pick === j;
                const state = !answered
                  ? "border-border hover:border-primary"
                  : isCorrect
                    ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-700"
                    : isPick
                      ? "border-destructive/50 bg-destructive/5 text-destructive"
                      : "border-border opacity-60";
                return (
                  <button
                    key={j}
                    disabled={answered}
                    onClick={() => setPicks((p) => ({ ...p, [i]: j }))}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${state}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why:</span> {q.explanation}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
