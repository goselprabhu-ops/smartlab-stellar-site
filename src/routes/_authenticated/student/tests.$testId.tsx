import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Timer,
  ArrowLeft,
  ArrowRight,
  Send,
  Brain,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/states/LoadingState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTest } from "@/lib/tests.functions";
import { submitAttempt } from "@/lib/quizzes.functions";

export const Route = createFileRoute("/_authenticated/student/tests/$testId")({
  head: () => ({ meta: [{ title: "Test — Smart Lab Online" }] }),
  component: TestPage,
});

type Question = {
  id: string;
  prompt: string;
  type: "mcq" | "multi" | "short";
  options: string[];
  points: number;
  order_index: number;
};

function TestPage() {
  const { testId } = Route.useParams();
  const navigate = Route.useNavigate();
  const getTestFn = useServerFn(getTest);
  const submitFn = useServerFn(submitAttempt);

  const [phase, setPhase] = useState<"intro" | "run">("intro");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [cursor, setCursor] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data, isLoading, error } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => getTestFn({ data: { id: testId } }),
  });

  const submit = useMutation({
    mutationFn: (final: Record<string, string | string[]>) =>
      submitFn({ data: { quiz_id: testId, answers: final } }),
    onSuccess: (res) => {
      toast.success(`Scored ${res.score}/${res.total}`);
      navigate({
        to: "/student/tests/$testId/results/$attemptId",
        params: { testId, attemptId: res.attempt.id },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (phase !== "run" || !data?.quiz.time_limit_seconds) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase, data?.quiz.time_limit_seconds]);

  const remaining = useMemo(() => {
    if (!startedAt || !data?.quiz.time_limit_seconds) return null;
    const elapsed = Math.floor((now - startedAt) / 1000);
    return Math.max(0, data.quiz.time_limit_seconds - elapsed);
  }, [startedAt, now, data?.quiz.time_limit_seconds]);

  useEffect(() => {
    if (remaining === 0 && !submit.isPending && phase === "run") {
      toast.message("Time's up — submitting your test");
      submit.mutate(answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (isLoading) return <LoadingState />;
  if (error || !data)
    return (
      <ErrorBlock
        message={error instanceof Error ? error.message : "Test not found"}
      />
    );

  const questions = data.questions as Question[];

  if (phase === "intro") {
    return (
      <TestIntro
        title={data.quiz.title}
        description={data.quiz.description}
        kind={data.quiz.kind}
        difficulty={data.quiz.difficulty}
        timeLimit={data.quiz.time_limit_seconds}
        questionCount={questions.length}
        onStart={() => {
          if (questions.length === 0) {
            toast.error("This test has no questions yet");
            return;
          }
          setPhase("run");
          setStartedAt(Date.now());
          setNow(Date.now());
        }}
      />
    );
  }

  const q = questions[cursor];
  const answered = Object.keys(answers).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Question {cursor + 1} of {questions.length}
          </div>
          <h1 className="font-display mt-1 line-clamp-1 text-xl font-semibold">{data.quiz.title}</h1>
        </div>
        <CountdownPill remaining={remaining} />
      </div>

      <Progress value={((cursor + 1) / questions.length) * 100} className="h-1.5" />

      <div className="rounded-2xl border bg-card p-6 elev-2 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline">{q.points} pt</Badge>
          <Badge variant="secondary" className="capitalize">{q.type}</Badge>
        </div>
        <p className="font-display text-xl font-semibold leading-snug">{q.prompt}</p>

        <div className="mt-6 space-y-2">
          {q.type === "short" ? (
            <input
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Type your answer"
              className="w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            (q.options ?? []).map((opt) => {
              const isMulti = q.type === "multi";
              const cur = answers[q.id];
              const selected = isMulti
                ? Array.isArray(cur) && cur.includes(opt)
                : cur === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (isMulti) {
                      const arr = Array.isArray(cur) ? [...cur] : [];
                      const idx = arr.indexOf(opt);
                      if (idx >= 0) arr.splice(idx, 1);
                      else arr.push(opt);
                      setAnswers((a) => ({ ...a, [q.id]: arr }));
                    } else {
                      setAnswers((a) => ({ ...a, [q.id]: opt }));
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-left text-sm transition-all hover:border-primary/50",
                    selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
                  )}
                >
                  <span>{opt}</span>
                  {selected ? <CheckCircle2 className="size-4 text-primary" /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCursor((c) => Math.max(0, c - 1))}
          disabled={cursor === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>
        <div className="text-xs text-muted-foreground">
          {answered} of {questions.length} answered
        </div>
        {cursor === questions.length - 1 ? (
          <Button
            onClick={() => submit.mutate(answers)}
            disabled={submit.isPending}
            className="gap-2"
          >
            {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit
          </Button>
        ) : (
          <Button onClick={() => setCursor((c) => Math.min(questions.length - 1, c + 1))} className="gap-2">
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card/50 p-3">
        <div className="flex flex-wrap gap-2">
          {questions.map((qq, i) => {
            const done = answers[qq.id] !== undefined && (Array.isArray(answers[qq.id]) ? (answers[qq.id] as string[]).length : true);
            return (
              <button
                key={qq.id}
                onClick={() => setCursor(i)}
                className={cn(
                  "h-8 w-8 rounded-lg border text-xs font-medium transition-colors",
                  i === cursor && "border-primary bg-primary text-primary-foreground",
                  i !== cursor && done && "border-primary/40 bg-primary/10 text-primary",
                  i !== cursor && !done && "bg-background text-muted-foreground hover:border-primary/30",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TestIntro({
  title,
  description,
  kind,
  difficulty,
  timeLimit,
  questionCount,
  onStart,
}: {
  title: string;
  description: string | null;
  kind: string;
  difficulty: number;
  timeLimit: number | null;
  questionCount: number;
  onStart: () => void;
}) {
  const minutes = timeLimit ? Math.round(timeLimit / 60) : null;
  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <Link to="/student/tests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All tests
      </Link>
      <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 elev-2 sm:p-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{kind.replace("_", " ")}</Badge>
          <Badge variant="secondary">Level {difficulty}/5</Badge>
        </div>
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <IntroStat icon={Layers} label="Questions" value={questionCount} />
          <IntroStat icon={Timer} label="Time" value={minutes ? `${minutes}m` : "Untimed"} />
          <IntroStat icon={Brain} label="Difficulty" value={`${difficulty}/5`} />
        </div>
        <Button size="lg" className="mt-6 w-full gap-2" onClick={onStart}>
          <Sparkles className="size-4" />
          Start test
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Instant scoring · Weak-area detection · Leaderboard ranking
        </p>
      </div>
    </div>
  );
}

function IntroStat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-background/60 p-4 text-center">
      <Icon className="mx-auto mb-1 size-4 text-primary" />
      <div className="font-display text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function CountdownPill({ remaining }: { remaining: number | null }) {
  if (remaining === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <Timer className="size-3.5" /> Untimed
      </span>
    );
  }
  const m = Math.floor(remaining / 60);
  const s = (remaining % 60).toString().padStart(2, "0");
  const urgent = remaining < 60;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
        urgent ? "border-destructive/40 bg-destructive/10 text-destructive animate-pulse" : "border-primary/30 bg-primary/5 text-primary",
      )}
    >
      <Timer className="size-3.5" />
      {m}:{s}
    </span>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="size-5" />
        <span className="font-medium">{message}</span>
      </div>
      <Link to="/student/tests" className="mt-3 inline-block text-sm text-primary hover:underline">
        ← Back to tests
      </Link>
    </div>
  );
}
