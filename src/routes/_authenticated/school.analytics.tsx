import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMySchools, getSchoolOverview } from "@/lib/schools.functions";
import { StatCard } from "@/components/ui/stat-card";

export const Route = createFileRoute("/_authenticated/school/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const listFn = useServerFn(listMySchools);
  const overviewFn = useServerFn(getSchoolOverview);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const overview = useQuery({
    queryKey: ["school-overview", school?.id],
    queryFn: () => overviewFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const c = overview.data?.counts;
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Institution-level rollup across batches, attendance, and assignments.
      </p>
      {c && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total students" value={c.students} />
          <StatCard label="Total teachers" value={c.teachers} />
          <StatCard label="Active batches" value={c.batches} />
          <StatCard
            label="Attendance today"
            value={c.attendanceTodayPct == null ? "—" : `${c.attendanceTodayPct}%`}
          />
        </div>
      )}
    </section>
  );
}
