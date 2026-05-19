import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  TrendingDown,
  ArrowLeft,
  RotateCcw,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { LoadingState } from "@/components/states/LoadingState";
import { cn } from "@/lib/utils";
import { getAttemptResult, getTestLeaderboard } from "@/lib/tests.functions";

export const Route = createFileRoute(
  "/_authenticated/student/tests/$testId/results/$attemptId",
)({
  head: () => ({ meta: [{ title: "Result — Smart Lab Online" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { testId, attemptId } = Route.useParams();
  const resultFn = useServerFn(getAttemptResult);
  const lbFn = useServerFn(getTestLeaderboard);

  const result = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => resultFn({ data: { id: attemptId } }),
  });
  const leaderboard = useQuery({
    queryKey: ["test-lb", testId],
    queryFn: () => lbFn({ data: { quizId: testId } }),
  });

  if (result.isLoading) return <LoadingState />;
  if (!result.data) return <div className="text-sm text-muted-foreground">Result not found.</div>;

  const { attempt, quiz, review, weakAreas } = result.data;
  const pct = attempt.total > 0 ? Math.round((Number(attempt.score) / Number(attempt.total)) * 100) : 0;
  const correct = review.filter((r) => r.isCorrect).length;
  const wrong = review.length - correct;
  const verdict = pct >= 80 ? "Excellent" : pct >= 60 ? "Solid" : pct >= 40 ? "Keep going" : "Needs work";
  const myRow = leaderboard.data?.rows.find((r) => r.isMe);

  return (
    <div className="animate-fade-in space-y-8">
      <Link to="/student/tests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All tests
      </Link>

      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 elev-2 sm:p-10">
        <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
          <ScoreRing pct={pct} />
          <div>
            <Badge variant="outline" className="mb-2">{verdict}</Badge>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{quiz?.title}</h1>
            <p className="mt-1 text-muted-foreground">
              You scored <span className="font-semibold text-foreground">{Number(attempt.score)}</span> of{" "}
              {Number(attempt.total)} points
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Mini icon={CheckCircle2} label="Correct" value={correct} tone="success" />
              <Mini icon={XCircle} label="Wrong" value={wrong} tone="danger" />
              <Mini icon={Trophy} label="Rank" value={myRow ? `#${myRow.rank}` : "—"} tone="primary" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Question review</h2>
          <div className="space-y-3">
            {review.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-2xl border bg-card p-5 elev-2",
                  r.isCorrect ? "border-l-4 border-l-primary" : "border-l-4 border-l-destructive",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="font-medium">{r.prompt}</p>
                  </div>
                  {r.isCorrect ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-destructive" />
                  )}
                </div>
                {r.type !== "short" ? (
                  <div className="mt-3 space-y-1.5 pl-9">
                    {(r.options as string[]).map((opt) => {
                      const isCorrect = r.correct.some((c) => String(c).toLowerCase() === opt.toLowerCase());
                      const isGiven = Array.isArray(r.given)
                        ? r.given.includes(opt)
                        : r.given === opt;
                      return (
                        <div
                          key={opt}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm",
                            isCorrect && "border-primary/40 bg-primary/5",
                            isGiven && !isCorrect && "border-destructive/40 bg-destructive/5",
                          )}
                        >
                          <span>{opt}</span>
                          <span className="text-xs text-muted-foreground">
                            {isCorrect ? "Correct" : isGiven ? "Your answer" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 pl-9 text-sm">
                    <div className="text-muted-foreground">Your answer:</div>
                    <div className="mt-1">{(r.given as string) || <em className="text-muted-foreground">No answer</em>}</div>
                    <div className="mt-2 text-muted-foreground">Accepted:</div>
                    <div className="mt-1 text-primary">{r.correct.join(", ")}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 elev-2">
            <h3 className="font-display flex items-center gap-2 text-base font-semibold">
              <TrendingDown className="size-4 text-destructive" />
              Weak areas
            </h3>
            {weakAreas.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No weak spots detected — strong attempt!</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {weakAreas.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border bg-background/60 p-2.5">
                    <Target className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                    <span className="line-clamp-2">{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 elev-2">
            <h3 className="font-display flex items-center gap-2 text-base font-semibold">
              <Crown className="size-4 text-warning" />
              Leaderboard
            </h3>
            <div className="mt-3 space-y-1.5">
              {(leaderboard.data?.rows ?? []).slice(0, 8).map((r) => {
                const rowPct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                return (
                  <div
                    key={r.rank}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm",
                      r.isMe && "bg-primary/10",
                    )}
                  >
                    <span className="w-6 font-mono text-xs text-muted-foreground">#{r.rank}</span>
                    <span className={cn("flex-1 truncate", r.isMe && "font-semibold")}>{r.name}</span>
                    <span className="font-mono text-xs tabular-nums">{rowPct}%</span>
                  </div>
                );
              })}
              {(!leaderboard.data || leaderboard.data.rows.length === 0) && (
                <p className="text-sm text-muted-foreground">Be the first to set a score!</p>
              )}
            </div>
          </section>

          <Link to="/student/tests/$testId" params={{ testId }}>
            <Button variant="outline" className="w-full gap-2">
              <RotateCcw className="size-4" />
              Retake test
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative size-32 sm:size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl font-bold sm:text-4xl">{pct}%</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</div>
      </div>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  tone: "success" | "danger" | "primary";
}) {
  const colors = {
    success: "text-primary",
    danger: "text-destructive",
    primary: "text-foreground",
  } as const;
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <Icon className={cn("mb-1 size-4", colors[tone])} />
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

