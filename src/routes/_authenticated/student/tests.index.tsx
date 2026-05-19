import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Timer,
  Trophy,
  Target,
  TrendingUp,
  Search,
  Loader2,
  Play,
  Brain,
  ClipboardCheck,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { LoadingState } from "@/components/states/LoadingState";
import { listTests, getMyTestStats, generateAiTest } from "@/lib/tests.functions";

export const Route = createFileRoute("/_authenticated/student/tests/")({
  head: () => ({ meta: [{ title: "Tests — Smart Lab Online" }] }),
  component: TestsIndex,
});

const KIND_LABEL: Record<string, { label: string; icon: typeof Brain }> = {
  chapter: { label: "Chapter", icon: Layers },
  micro: { label: "Micro", icon: Target },
  full_mock: { label: "Full mock", icon: Trophy },
  diagnostic: { label: "Diagnostic", icon: Brain },
  ai: { label: "AI", icon: Sparkles },
};

function TestsIndex() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const listFn = useServerFn(listTests);
  const statsFn = useServerFn(getMyTestStats);

  const kind = tab === "all" ? undefined : (tab as "chapter" | "micro" | "full_mock" | "ai" | "diagnostic");
  const tests = useQuery({
    queryKey: ["tests", kind ?? "all", search],
    queryFn: () => listFn({ data: { kind, search: search || undefined } }),
  });
  const stats = useQuery({ queryKey: ["my-test-stats"], queryFn: () => statsFn() });

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Assessment engine
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              Tests built around how you learn
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Timed exams, chapter drills, full-syllabus mocks, and AI-generated tests — all scored
              instantly with weak-area detection and rankings.
            </p>
          </div>
          <GenerateAiTestDialog onCreated={() => tests.refetch()} />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <StatTile
          icon={Trophy}
          label="Tests taken"
          value={stats.data?.taken ?? 0}
          hint="All time"
        />
        <StatTile
          icon={Target}
          label="Avg accuracy"
          value={`${stats.data?.accuracy ?? 0}%`}
          hint="Across all attempts"
        />
        <StatTile
          icon={TrendingUp}
          label="Last test"
          value={stats.data?.lastScore !== null && stats.data?.lastScore !== undefined ? `${stats.data.lastScore}%` : "—"}
          hint="Most recent score"
        />
        <Sparkline trend={stats.data?.trend ?? []} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="chapter">Chapter</TabsTrigger>
            <TabsTrigger value="full_mock">Full mocks</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests"
            className="pl-9"
          />
        </div>
      </div>

      {tests.isLoading ? (
        <LoadingState />
      ) : (tests.data?.tests ?? []).length === 0 ? (
        <EmptyTests />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(tests.data?.tests ?? []).map((t) => {
            const meta = KIND_LABEL[t.kind] ?? KIND_LABEL.chapter;
            const Icon = meta.icon;
            const minutes = t.time_limit_seconds ? Math.round(t.time_limit_seconds / 60) : null;
            return (
              <Link
                key={t.id}
                to="/student/tests/$testId"
                params={{ testId: t.id }}
                className="group flex flex-col rounded-2xl border bg-card p-5 elev-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {meta.label}
                  </Badge>
                </div>
                <h3 className="font-display mt-4 line-clamp-2 text-lg font-semibold">{t.title}</h3>
                {t.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                ) : null}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ClipboardCheck className="size-3.5" />
                    {t.question_count} Qs
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Timer className="size-3.5" />
                    {minutes ? `${minutes} min` : "Untimed"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Brain className="size-3.5" />
                    L{t.difficulty}
                  </span>
                </div>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Start test <Play className="size-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <Icon className="mb-3 size-5 text-primary" />
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Sparkline({ trend }: { trend: { i: number; pct: number }[] }) {
  const max = Math.max(100, ...trend.map((t) => t.pct));
  const points = trend.length
    ? trend
        .map((t, i) => {
          const x = trend.length === 1 ? 50 : (i / (trend.length - 1)) * 100;
          const y = 100 - (t.pct / max) * 100;
          return `${x},${y}`;
        })
        .join(" ")
    : "";
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <TrendingUp className="mb-3 size-5 text-primary" />
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Trend (last 10)</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-16 w-full">
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function EmptyTests() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
      <Sparkles className="mx-auto mb-3 size-8 text-primary" />
      <h3 className="font-display text-lg font-semibold">No tests match those filters</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try another tab, clear the search, or generate a custom AI test on any topic.
      </p>
    </div>
  );
}

function GenerateAiTestDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState(2);
  const generateFn = useServerFn(generateAiTest);
  const navigate = Route.useNavigate();

  const mutation = useMutation({
    mutationFn: () => generateFn({ data: { topic, count, difficulty } }),
    onSuccess: (res) => {
      toast.success(`Generated ${res.count} questions`);
      setOpen(false);
      onCreated();
      navigate({ to: "/student/tests/$testId", params: { testId: res.quizId } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Sparkles className="size-4" />
          Generate AI test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate a custom test</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic equations, Newton's laws"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label>Questions: {count}</Label>
            <Slider
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
              min={3}
              max={15}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty: {difficulty}/5</Label>
            <Slider
              value={[difficulty]}
              onValueChange={(v) => setDifficulty(v[0])}
              min={1}
              max={5}
              step={1}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!topic.trim() || mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
