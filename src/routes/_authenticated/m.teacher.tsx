import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, ClipboardCheck, BarChart3, Bell, Settings, ChevronRight, Sparkles } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { useAuth } from "@/hooks/use-auth";

const TABS: MobileTab[] = [
  { to: "/m/teacher", label: "Home", icon: Home },
  { to: "/admin/content", label: "Content", icon: ClipboardCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
  { to: "/settings", label: "Account", icon: Settings },
];

export const Route = createFileRoute("/_authenticated/m/teacher")({
  component: TeacherMobile,
});

function TeacherMobile() {
  const { profile } = useAuth();
  const first = (profile?.full_name ?? "").split(" ")[0] || "Teacher";
  return (
    <MobileShell title={`Hi, ${first}`} tabs={TABS}>
      <p className="mb-4 text-xs text-muted-foreground">Quick tools on the go.</p>
      <div className="space-y-2.5">
        <NavCard to="/admin/content" title="Content pipeline" body="Ingest, structure, generate." icon={<Sparkles className="size-4 text-primary" />} />
        <NavCard to="/admin/users" title="Students" body="View progress and intervene." />
        <NavCard to="/admin/analytics" title="Class analytics" body="Performance and trends." />
        <NavCard to="/admin/notifications" title="Send notice" body="Reach students and parents." />
      </div>
    </MobileShell>
  );
}

function NavCard({ to, title, body, icon }: { to: string; title: string; body: string; icon?: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-2xl border bg-card p-4 elev-1 active:scale-[0.99]">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{body}</div>
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
