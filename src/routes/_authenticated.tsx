import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, BookOpen, ClipboardCheck, LineChart, Sparkles, Users, Settings, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const auth = useAuth();
  const nav = useNavigate();
  if (!auth.ready) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!auth.user) return null;

  const isAdmin = auth.hasRole("admin");
  const isParent = auth.hasRole("parent");

  const links = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    !isParent && { to: "/student/courses", label: "Courses", icon: BookOpen },
    !isParent && { to: "/student/quizzes", label: "Quizzes", icon: ClipboardCheck },
    !isParent && { to: "/student/progress", label: "Progress", icon: LineChart },
    !isParent && { to: "/student/recommendations", label: "AI Recommendations", icon: Sparkles },
    isParent && { to: "/parent", label: "My students", icon: Users },
    isAdmin && { to: "/admin", label: "Admin", icon: Shield },
    { to: "/settings", label: "Settings", icon: Settings },
  ].filter(Boolean) as { to: string; label: string; icon: typeof LayoutDashboard }[];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-5 lg:block">
        <div className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Smart Lab</div>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}>
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          <button onClick={async () => { await auth.signOut(); nav({ to: "/" }); }}
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 lg:px-10"><Outlet /></main>
    </div>
  );
}
