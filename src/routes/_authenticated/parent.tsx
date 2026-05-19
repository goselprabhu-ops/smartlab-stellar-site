import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listLinkedStudents } from "@/lib/progress.functions";

export const Route = createFileRoute("/_authenticated/parent")({
  component: Parent,
});

function Parent() {
  const fn = useServerFn(listLinkedStudents);
  const { data } = useQuery({ queryKey: ["linked-students"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">My students</h1>
      <p className="mt-2 text-sm text-muted-foreground">Track progress and quiz attempts for linked students.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(data ?? []).map((s) => (
          <div key={s.user_id} className="rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-lg font-semibold">{s.full_name ?? "Student"}</div>
            <div className="text-sm text-muted-foreground">Grade {s.grade ?? "—"} · {s.school ?? ""}</div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-sm text-muted-foreground">No students linked yet. Link a student by their account ID from settings.</div>
        )}
      </div>
    </div>
  );
}
