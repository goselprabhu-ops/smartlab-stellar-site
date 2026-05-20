import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Home, BookOpen, Sparkles, BarChart3, Bell, Flame, Target, Zap } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { MicroLessonCard } from "@/components/mobile/MicroLessonCard";
import { useOfflineQuery } from "@/lib/mobile/offline-cache";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useRevisionReminders } from "@/hooks/use-revision-reminders";
import { getStudentDashboard } from "@/lib/dashboard.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TABS: MobileTab[] = [
  { to: "/m/student", label: "Home", icon: Home },
  { to: "/m/learn", label: "Learn", icon: BookOpen },
  { to: "/m/tutor", label: "Tutor", icon: Sparkles },
  { to: "/m/progress", label: "Progress", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/m/student")({
  component: StudentMobileHome,
});

function StudentMobileHome() {
  const { profile } = useAuth();
  const fetchDash = useServerFn(getStudentDashboard);
  const { data, isStale, isOffline } = useOfflineQuery("student-dash", () => fetchDash());
  const { status, request } = usePushNotifications();

  // Use recommendations as "due reviews" surrogate if retention list isn't loaded here.
  const due = (data?.weeklyPlan ?? []).slice(0, 5).map((r: any, i: number) => ({
    id: r.id ?? `rec-${i}`,
    title: r.topic ?? "Review concept",
    dueAt: r.dueAt ?? new Date(Date.now() - 1000).toISOString(),
  }));
  useRevisionReminders(due);

  const first = (profile?.full_name ?? "").split(" ")[0] || "Student";

  return (
    <MobileShell title={`Hi, ${first}`} tabs={TABS}>
      {status !== "granted" && status !== "unsupported" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border bg-primary/5 p-3">
          <div className="text-xs">
            <div className="font-semibold">Smart revision reminders</div>
            <div className="text-muted-foreground">Get nudged when concepts are due.</div>
          </div>
          <Button size="sm" onClick={() => request()}>Enable</Button>
        </div>
      )}

      {(isStale || isOffline) && (
        <p className="mb-3 text-[11px] text-muted-foreground">
          {isOffline ? "Offline mode — showing your last saved data." : "Refreshing in background…"}
        </p>
      )}

      {!data ? (
        <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-2">
            <Tile icon={<Flame className="size-4" />} label="Streak" value={`${data.streak ?? 0}d`} />
            <Tile icon={<Target className="size-4" />} label="Today"  value={`${data.todayMinutes ?? 0}m`} />
            <Tile icon={<Zap className="size-4" />}   label="Goal"   value={`${data.goalMinutes ?? 0}m`} />
          </section>

          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Pick up where you left off</h2>
              <Link to="/m/learn" className="text-xs text-primary">See all</Link>
            </div>
            <div className="space-y-2.5">
              {(data.weeklyPlan ?? []).slice(0, 4).map((r: any, i: number) => (
                <MicroLessonCard
                  key={i}
                  title={r.topic ?? "Continue concept"}
                  subject={r.subject}
                  minutes={r.minutes ?? 4}
                  reason={r.reason}
                  to={r.microConceptId ? `/student/learn/${r.microConceptId}` : "/m/learn"}
                />
              ))}
              {!(data.weeklyPlan ?? []).length && (
                <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
                  Complete a quick diagnostic to get personalized suggestions.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </MobileShell>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
