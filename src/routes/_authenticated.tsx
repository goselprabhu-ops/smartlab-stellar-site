import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  LineChart,
  Sparkles,
  Users,
  Settings,
  LogOut,
  Shield,
  Menu,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Smart Lab Online" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: AuthLayout,
});

type NavLink = { to: string; label: string; icon: typeof LayoutDashboard };

function useNavLinks(): NavLink[] {
  const auth = useAuth();
  const isAdmin = auth.hasRole("admin");
  const isParent = auth.hasRole("parent");
  return [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    !isParent && { to: "/student/courses", label: "Courses", icon: BookOpen },
    !isParent && { to: "/student/quizzes", label: "Quizzes", icon: ClipboardCheck },
    !isParent && { to: "/student/progress", label: "Progress", icon: LineChart },
    !isParent && { to: "/student/recommendations", label: "Recommendations", icon: Sparkles },
    isParent && { to: "/parent", label: "My students", icon: Users },
    isAdmin && { to: "/admin", label: "Admin", icon: Shield },
    { to: "/settings", label: "Settings", icon: Settings },
  ].filter(Boolean) as NavLink[];
}

function NavList({ links, onNavigate }: { links: NavLink[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-soft hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-primary/10 text-primary" }}
        >
          <l.icon className="h-4 w-4" /> {l.label}
        </Link>
      ))}
    </nav>
  );
}

function AuthLayout() {
  const auth = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = useNavLinks();

  if (!auth.ready) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!auth.user) return null;

  const signOut = async () => {
    await auth.signOut();
    nav({ to: "/" });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-5 lg:flex lg:flex-col">
        <div className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Smart Lab
        </div>
        <NavList links={links} />
        <button
          onClick={signOut}
          className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-soft hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetTitle className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Smart Lab
              </SheetTitle>
              <NavList links={links} onNavigate={() => setMobileOpen(false)} />
              <button
                onClick={async () => {
                  setMobileOpen(false);
                  await signOut();
                }}
                className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </SheetContent>
          </Sheet>
          <span className="font-display text-sm font-semibold">Smart Lab</span>
          <div className="w-9" aria-hidden />
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
