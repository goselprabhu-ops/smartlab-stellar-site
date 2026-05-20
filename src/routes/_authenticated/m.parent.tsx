import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Users, BarChart3, Bell, Settings, ChevronRight } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { useAuth } from "@/hooks/use-auth";

const TABS: MobileTab[] = [
  { to: "/m/parent", label: "Home", icon: Home },
  { to: "/parent", label: "Students", icon: Users },
  { to: "/parent/intelligence", label: "Insights", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
  { to: "/settings", label: "Account", icon: Settings },
];

export const Route = createFileRoute("/_authenticated/m/parent")({
  component: ParentMobile,
});

function ParentMobile() {
  const { profile } = useAuth();
  const first = (profile?.full_name ?? "").split(" ")[0] || "Parent";
  return (
    <MobileShell title={`Hi, ${first}`} tabs={TABS}>
      <p className="mb-4 text-xs text-muted-foreground">Today at a glance.</p>
      <div className="space-y-2.5">
        <NavCard to="/parent" title="My students" body="Activity, scores, attendance." />
        <NavCard to="/parent/intelligence" title="Learning intelligence" body="AI insights and predictions." />
        <NavCard to="/parent/reports" title="Reports" body="Weekly and monthly performance." />
        <NavCard to="/parent/attendance" title="Attendance" body="Sessions, streaks, time-on-task." />
      </div>
    </MobileShell>
  );
}

function NavCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-2xl border bg-card p-4 elev-1 active:scale-[0.99]">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
