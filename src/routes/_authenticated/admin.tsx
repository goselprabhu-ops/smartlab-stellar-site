import { createFileRoute, Outlet, Link, Navigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, BookOpen, BarChart3, Brain, CreditCard, FolderTree, GraduationCap, Bell, FileBarChart, LifeBuoy, Activity, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const tabs: Array<{ to: string; label: string; icon: typeof Users; exact?: boolean }> = [
  { to: "/admin",                label: "Overview",      icon: LayoutDashboard, exact: true },
  { to: "/admin/users",          label: "Students",      icon: Users },
  { to: "/admin/teachers",       label: "Teachers",      icon: GraduationCap },
  { to: "/admin/content",        label: "Content",       icon: FolderTree },
  { to: "/admin/courses",        label: "Courses",       icon: BookOpen },
  { to: "/admin/analytics",      label: "Analytics",     icon: BarChart3 },
  { to: "/admin/ai",             label: "AI",            icon: Brain },
  { to: "/admin/notifications",  label: "Notifications", icon: Bell },
  { to: "/admin/subscriptions",  label: "Subscriptions", icon: CreditCard },
  { to: "/admin/reports",        label: "Reports",       icon: FileBarChart },
  { to: "/admin/support",        label: "Support",       icon: LifeBuoy },
  { to: "/admin/activity",       label: "Activity",      icon: Activity },
  { to: "/admin/launch",         label: "Launch",        icon: Rocket },
];

function AdminLayout() {
  const auth = useAuth();
  if (!auth.hasRole("admin")) return <Navigate to="/dashboard" />;

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Admin Panel</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Operations console</h1>
        <p className="text-muted-foreground">Users, content, AI usage, and platform health — all in one place.</p>
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
