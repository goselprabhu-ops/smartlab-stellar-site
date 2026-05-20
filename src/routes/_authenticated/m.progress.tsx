import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Home, BookOpen, Sparkles, BarChart3, Bell, TrendingUp, Trophy, Brain } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { useOfflineQuery } from "@/lib/mobile/offline-cache";
import { getStudentDashboard } from "@/lib/dashboard.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const TABS: MobileTab[] = [
  { to: "/m/student", label: "Home", icon: Home },
  { to: "/m/learn", label: "Learn", icon: BookOpen },
  { to: "/m/tutor", label: "Tutor", icon: Sparkles },
  { to: "/m/progress", label: "Progress", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/m/progress")({
  component: MobileProgress,
});

function MobileProgress() {
  const fetchDash = useServerFn(getStudentDashboard);
  const { data } = useOfflineQuery("student-dash", () => fetchDash());

  if (!data) {
    return (
      <MobileShell title="Progress" tabs={TABS}>
        <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
      </MobileShell>
    );
  }

  const goalPct = Math.min(100, Math.round(((data.todayMinutes ?? 0) / Math.max(1, data.goalMinutes ?? 1)) * 100));
  const avgScore = Math.round(data.avgScore ?? 0);

  return (
    <MobileShell title="Progress" tabs={TABS}>
      <div className="space-y-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Today's goal</span><span>{goalPct}%</span>
          </div>
          <Progress value={goalPct} className="h-2" />
          <div className="mt-1 text-[11px] text-muted-foreground">
            {data.todayMinutes ?? 0} of {data.goalMinutes ?? 0} min
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card icon={<TrendingUp className="size-4" />} label="Avg score 30d" value={`${avgScore}%`} />
          <Card icon={<Trophy className="size-4" />} label="Streak" value={`${data.streak ?? 0}d`} />
        </div>

        <Link to="/student/intelligence" className="block rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="size-4 text-primary" /> Open intelligence dashboard</div>
          <p className="mt-1 text-xs text-muted-foreground">Mastery, retention, predictions, recommendations.</p>
        </Link>
      </div>
    </MobileShell>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
