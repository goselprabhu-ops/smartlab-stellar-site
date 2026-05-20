import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMySchools, listSchoolStudents } from "@/lib/schools.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/school/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const listFn = useServerFn(listMySchools);
  const studentsFn = useServerFn(listSchoolStudents);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const students = useQuery({
    queryKey: ["school-students", school?.id],
    queryFn: () => studentsFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  return (
    <div className="rounded-2xl border bg-card p-2 elev-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(students.data ?? []).map((s) => (
            <TableRow key={s.user_id}>
              <TableCell>{s.profile?.full_name ?? "—"}</TableCell>
              <TableCell>{s.profile?.grade ?? "—"}</TableCell>
              <TableCell>{new Date(s.joined_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {students.data && !students.data.length && (
        <p className="p-4 text-sm text-muted-foreground">No students in this school yet.</p>
      )}
    </div>
  );
}
