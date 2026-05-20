import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { listMySchools, listBatches } from "@/lib/schools.functions";
import { listAssignments, createAssignment, updateAssignmentStatus } from "@/lib/assignments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const listFn = useServerFn(listMySchools);
  const batchesFn = useServerFn(listBatches);
  const asgFn = useServerFn(listAssignments);
  const createFn = useServerFn(createAssignment);
  const statusFn = useServerFn(updateAssignmentStatus);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const batches = useQuery({
    queryKey: ["batches", school?.id],
    queryFn: () => batchesFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const assignments = useQuery({
    queryKey: ["assignments", school?.id],
    queryFn: () => asgFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });

  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useMutation({
    mutationFn: () => createFn({
      data: {
        school_id: school!.id, batch_id: batchId,
        title, description_md: description, max_score: 100, status: "published",
      },
    }),
    onSuccess: () => { toast.success("Assignment created"); setTitle(""); setDescription(""); assignments.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" | "closed" }) =>
      statusFn({ data: { assignment_id: v.id, status: v.status } }),
    onSuccess: () => assignments.refetch(),
  });

  return (
    <section className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl border bg-card p-4"
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger><SelectValue placeholder="Pick a batch" /></SelectTrigger>
              <SelectContent>
                {(batches.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button type="submit" disabled={!batchId || !title || create.isPending}>
          {create.isPending ? "Creating…" : "Publish assignment"}
        </Button>
      </form>

      <div className="space-y-2">
        {(assignments.data ?? []).map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-4 elev-1">
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">
                {a.submission_count} submissions · max {a.max_score} pts
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge>
              {a.status !== "closed" && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "closed" })}>
                  Close
                </Button>
              )}
            </div>
          </div>
        ))}
        {assignments.data && !assignments.data.length && (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        )}
      </div>
    </section>
  );
}
