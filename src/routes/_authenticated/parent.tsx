import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Users, BarChart3, FileText, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent")({
  component: ParentLayout,
});

const tabs: Array<{ to: string; label: string; icon: typeof Users; exact?: boolean }> = [
  { to: "/parent",            label: "Children",  icon: Users,         exact: true },
  { to: "/parent/reports",    label: "Reports",   icon: FileText },
  { to: "/parent/attendance", label: "Attendance",icon: CalendarCheck },
  { to: "/parent/analytics",  label: "Analytics", icon: BarChart3 },
];

function ParentLayout() {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Parent Dashboard</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Stay close to your child's learning</h1>
        <p className="text-muted-foreground">Mastery, attendance, reports, and weekly digests for every linked student.</p>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 elev-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: !!t.exact }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-soft hover:bg-muted hover:text-foreground"
            activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
          >
            <t.icon className="size-4" /> {t.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
