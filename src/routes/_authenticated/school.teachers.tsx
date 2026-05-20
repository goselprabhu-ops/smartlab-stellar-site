import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMySchools, listSchoolTeachers } from "@/lib/schools.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/school/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const listFn = useServerFn(listMySchools);
  const teachersFn = useServerFn(listSchoolTeachers);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const teachers = useQuery({
    queryKey: ["school-teachers", school?.id],
    queryFn: () => teachersFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  return (
    <div className="rounded-2xl border bg-card p-2 elev-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Batches</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(teachers.data ?? []).map((t) => (
            <TableRow key={t.user_id + t.role}>
              <TableCell>{t.profile?.full_name ?? "—"}</TableCell>
              <TableCell><Badge variant="secondary">{t.role}</Badge></TableCell>
              <TableCell>{t.batches.map((b) => b.name).join(", ") || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
