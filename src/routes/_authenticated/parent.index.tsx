import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listLinkedStudents } from "@/lib/progress.functions";

export const Route = createFileRoute("/_authenticated/parent/")({
  component: ParentChildren,
});

function ParentChildren() {
  const fn = useServerFn(listLinkedStudents);
  const { data } = useQuery({ queryKey: ["linked-students"], queryFn: () => fn() });
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Your children</h2>
      <p className="mt-1 text-sm text-muted-foreground">Link a student from settings using their account ID.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data ?? []).map((s) => (
          <div key={s.user_id} className="hover-lift rounded-2xl border bg-card p-6 elev-2">
            <div className="font-display text-lg font-semibold">{s.full_name ?? "Student"}</div>
            <div className="text-sm text-muted-foreground">Grade {s.grade ?? "—"} · {s.school ?? ""}</div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-sm text-muted-foreground">No students linked yet.</div>
        )}
      </div>
    </section>
  );
}
