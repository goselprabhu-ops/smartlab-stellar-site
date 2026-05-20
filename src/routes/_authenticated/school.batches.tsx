import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { listMySchools, listBatches, createBatch } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/batches")({
  component: BatchesPage,
});

function BatchesPage() {
  const listFn = useServerFn(listMySchools);
  const batchesFn = useServerFn(listBatches);
  const createFn = useServerFn(createBatch);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const batches = useQuery({
    queryKey: ["batches", school?.id],
    queryFn: () => batchesFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const m = useMutation({
    mutationFn: () => createFn({ data: { school_id: school!.id, name, grade, section } }),
    onSuccess: () => { toast.success("Batch created"); setName(""); batches.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-4"
        onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
      >
        <div className="space-y-1 sm:col-span-2">
          <Label>Batch name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Grade 10 — A" />
        </div>
        <div className="space-y-1">
          <Label>Grade</Label>
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="10" />
        </div>
        <div className="space-y-1">
          <Label>Section</Label>
          <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" />
        </div>
        <Button type="submit" disabled={m.isPending} className="sm:col-span-4">
          {m.isPending ? "Creating…" : "Create batch"}
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(batches.data ?? []).map((b) => (
          <div key={b.id} className="rounded-2xl border bg-card p-4 elev-1">
            <div className="font-display text-lg font-semibold">{b.name}</div>
            <div className="text-xs text-muted-foreground">
              Grade {b.grade ?? "—"} · Section {b.section ?? "—"}
            </div>
            <div className="mt-3 text-sm">{b.student_count} students</div>
          </div>
        ))}
        {batches.data && !batches.data.length && (
          <p className="text-sm text-muted-foreground">No batches yet. Create your first batch above.</p>
        )}
      </div>
    </section>
  );
}
