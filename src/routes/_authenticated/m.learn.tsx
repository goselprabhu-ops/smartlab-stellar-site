import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Home, BookOpen, Sparkles, BarChart3, Bell } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { MicroLessonCard } from "@/components/mobile/MicroLessonCard";
import { useOfflineQuery } from "@/lib/mobile/offline-cache";
import { getStudentDashboard } from "@/lib/dashboard.functions";
import { Skeleton } from "@/components/ui/skeleton";

const TABS: MobileTab[] = [
  { to: "/m/student", label: "Home", icon: Home },
  { to: "/m/learn", label: "Learn", icon: BookOpen },
  { to: "/m/tutor", label: "Tutor", icon: Sparkles },
  { to: "/m/progress", label: "Progress", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/m/learn")({
  component: MobileLearn,
});

function MobileLearn() {
  const fetchDash = useServerFn(getStudentDashboard);
  const { data, isOffline } = useOfflineQuery("student-dash", () => fetchDash());
  const recs = (data?.weeklyPlan ?? []) as any[];

  return (
    <MobileShell title="Micro lessons" tabs={TABS}>
      {isOffline && <p className="mb-3 text-[11px] text-muted-foreground">Offline — cached lessons only.</p>}
      <p className="mb-3 text-xs text-muted-foreground">Short, focused, AI-curated for your weakest concepts.</p>
      {!data ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2.5">
          {recs.map((r, i) => (
            <MicroLessonCard
              key={i}
              title={r.topic ?? "Micro lesson"}
              subject={r.subject}
              minutes={r.minutes ?? 4}
              reason={r.reason}
              to={r.microConceptId ? `/student/learn/${r.microConceptId}` : "/student/recommendations"}
            />
          ))}
          {!recs.length && (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No lessons cached yet. Connect to the internet to load your plan.
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
}
