import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listMySchools, listBatches } from "@/lib/schools.functions";
import { getBatchAttendance, markBatchAttendance } from "@/lib/attendance.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["present", "absent", "late", "excused"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/_authenticated/school/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const listFn = useServerFn(listMySchools);
  const batchesFn = useServerFn(listBatches);
  const attFn = useServerFn(getBatchAttendance);
  const markFn = useServerFn(markBatchAttendance);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const batches = useQuery({
    queryKey: ["batches", school?.id],
    queryFn: () => batchesFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const [batchId, setBatchId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const att = useQuery({
    queryKey: ["att", batchId, date],
    queryFn: () => attFn({ data: { batch_id: batchId, date } }),
    enabled: !!batchId,
  });
  const [draft, setDraft] = useState<Record<string, Status>>({});
  const rows = att.data ?? [];
  useMemo(() => {
    const next: Record<string, Status> = {};
    for (const r of rows) next[r.student_id] = (r.status as Status) ?? "present";
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [att.data]);

  const save = useMutation({
    mutationFn: () => markFn({
      data: {
        batch_id: batchId, date,
        records: Object.entries(draft).map(([student_id, status]) => ({ student_id, status })),
      },
    }),
    onSuccess: () => { toast.success("Attendance saved"); att.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-6">
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Batch</Label>
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger><SelectValue placeholder="Pick a batch" /></SelectTrigger>
            <SelectContent>
              {(batches.data ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => save.mutate()} disabled={!batchId || save.isPending} className="w-full">
            {save.isPending ? "Saving…" : "Save attendance"}
          </Button>
        </div>
      </div>

      {batchId && (
        <div className="space-y-2 rounded-2xl border bg-card p-4">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No students in this batch yet.</p>}
          {rows.map((r) => (
            <div key={r.student_id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div className="text-sm">{r.name}</div>
              <Select
                value={draft[r.student_id] ?? "present"}
                onValueChange={(v) => setDraft((d) => ({ ...d, [r.student_id]: v as Status }))}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
