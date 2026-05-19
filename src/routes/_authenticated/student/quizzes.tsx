import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listQuizzes } from "@/lib/quizzes.functions";

export const Route = createFileRoute("/_authenticated/student/quizzes")({
  component: Quizzes,
});

function Quizzes() {
  const fn = useServerFn(listQuizzes);
  const { data } = useQuery({ queryKey: ["quizzes"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Quizzes</h1>
      <div className="mt-8 grid gap-3">
        {(data ?? []).map((q) => (
          <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
            <div>
              <div className="font-display text-base font-semibold">{q.title}</div>
              <div className="text-xs text-muted-foreground">{q.courses?.title}</div>
            </div>
            <div className="text-xs text-muted-foreground">{q.time_limit_seconds ? `${Math.round(q.time_limit_seconds / 60)} min` : "Untimed"}</div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="text-sm text-muted-foreground">No quizzes available yet.</div>}
      </div>
    </div>
  );
}
