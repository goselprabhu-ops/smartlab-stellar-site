import { createFileRoute, Outlet, Link, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, ClipboardList, BarChart3, Sparkles, BookOpen, Settings } from "lucide-react";
import { listMySchools } from "@/lib/schools.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/school")({
  component: SchoolLayout,
});

const tabs = [
  { to: "/school", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/school/batches", label: "Batches", icon: BookOpen },
  { to: "/school/students", label: "Students", icon: Users },
  { to: "/school/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/school/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/school/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/school/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/school/insights", label: "AI Insights", icon: Sparkles },
  { to: "/school/settings", label: "Settings", icon: Settings },
] as const;

function SchoolLayout() {
  const { ready } = useAuth();
  const listFn = useServerFn(listMySchools);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn(), enabled: ready });

  if (!ready || schools.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading school workspace…</div>;
  }
  if (!schools.data?.length) return <Navigate to="/schools/onboard" />;

  const active = schools.data[0];

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
          School Workspace
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{active.name}</h1>
        <p className="text-muted-foreground">
          Batches, attendance, assignments, and institution-level insights for your school.
        </p>
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
