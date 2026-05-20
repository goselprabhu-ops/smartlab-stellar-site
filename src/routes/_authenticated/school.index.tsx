import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, GraduationCap, BookOpen, CalendarCheck, ClipboardList, Sparkles } from "lucide-react";
import { listMySchools, getSchoolOverview } from "@/lib/schools.functions";
import { getLatestSchoolInsights, generateSchoolInsights } from "@/lib/school-insights.functions";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/")({
  component: SchoolDashboard,
});

function SchoolDashboard() {
  const listFn = useServerFn(listMySchools);
  const overviewFn = useServerFn(getSchoolOverview);
  const insightsFn = useServerFn(getLatestSchoolInsights);
  const regenFn = useServerFn(generateSchoolInsights);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const overview = useQuery({
    queryKey: ["school-overview", school?.id],
    queryFn: () => overviewFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const insights = useQuery({
    queryKey: ["school-insights", school?.id],
    queryFn: () => insightsFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const regen = useMutation({
    mutationFn: () => regenFn({ data: { school_id: school!.id } }),
    onSuccess: () => { toast.success("Insights refreshed"); insights.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!school || overview.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }
  const c = overview.data!.counts;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="size-4" />} label="Students" value={c.students} />
        <StatCard icon={<GraduationCap className="size-4" />} label="Teachers" value={c.teachers} />
        <StatCard icon={<BookOpen className="size-4" />} label="Batches" value={c.batches} />
        <StatCard
          icon={<CalendarCheck className="size-4" />}
          label="Attendance today"
          value={c.attendanceTodayPct == null ? "—" : `${c.attendanceTodayPct}%`}
          hint={c.attendanceTodayMarked ? `${c.attendanceTodayMarked} marked` : "Not marked yet"}
        />
        <StatCard
          icon={<ClipboardList className="size-4" />}
          label="Active assignments"
          value={c.activeAssignments}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 elev-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">AI school insights</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => regen.mutate()} disabled={regen.isPending}>
            {regen.isPending ? "Generating…" : "Refresh"}
          </Button>
        </div>
        {insights.data?.payload ? (
          <div className="space-y-3">
            <p className="font-display text-xl">{(insights.data.payload as any).headline}</p>
            <p className="text-sm text-muted-foreground">{(insights.data.payload as any).summary}</p>
            <div className="grid gap-3 md:grid-cols-3">
              {(["highlights", "risks", "actions"] as const).map((k) => (
                <div key={k} className="rounded-xl border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
                  <ul className="space-y-1 text-sm">
                    {((insights.data!.payload as any)[k] ?? []).map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No insights yet — click <strong>Refresh</strong> to generate a weekly brief.
          </p>
        )}
      </div>
    </section>
  );
}
