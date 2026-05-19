import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCourses } from "@/lib/courses.functions";

export const Route = createFileRoute("/_authenticated/student/courses")({
  component: Courses,
});

function Courses() {
  const fn = useServerFn(listCourses);
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Courses</h1>
      {isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.grade ?? "All grades"}</div>
              <div className="mt-2 font-display text-lg font-semibold">{c.title}</div>
              <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="text-sm text-muted-foreground">No published courses yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
