import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProgress } from "@/lib/progress.functions";

export const Route = createFileRoute("/_authenticated/student/progress")({
  component: Progress,
});

function Progress() {
  const fn = useServerFn(getMyProgress);
  const { data } = useQuery({ queryKey: ["my-progress"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Your progress</h1>
      <div className="mt-8 space-y-2">
        {(data ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="text-sm">{p.lessons?.courses?.title} · {p.lessons?.title}</div>
            <div className="text-xs text-muted-foreground">Mastery {Number(p.mastery).toFixed(0)}%</div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="text-sm text-muted-foreground">No progress recorded yet.</div>}
      </div>
    </div>
  );
}
