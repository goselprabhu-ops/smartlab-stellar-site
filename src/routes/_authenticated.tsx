import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, BookOpen, Map, Sparkles, ClipboardCheck, LineChart,
  StickyNote, Trophy, Bell, MessageSquare, Library, Settings, LogOut,
  Shield, Users, Menu,
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
type NavGroup = { title: string; links: NavLink[] };

function useNavGroups(): NavGroup[] {
  const auth = useAuth();
  const isAdmin = auth.hasRole("admin");
  const isParent = auth.hasRole("parent");

  if (isParent) {
    return [
      {
        title: "Parent",
        links: [
          { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
          { to: "/parent",    label: "My students", icon: Users },
        ],
      },
      {
        title: "Account",
        links: [{ to: "/settings", label: "Settings", icon: Settings }],
      },
    ];
  }

  return [
    {
      title: "Learn",
      links: [
        { to: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard },
        { to: "/student/subjects",     label: "Subjects",    icon: Library },
        { to: "/student/courses",      label: "Courses",     icon: BookOpen },
        { to: "/student/study-path",   label: "Study path",  icon: Map },
        { to: "/student/ai-tutor",     label: "AI tutor",    icon: MessageSquare },
      ],
    },
    {
      title: "Practice",
      links: [
        { to: "/student/tests",        label: "Tests",       icon: ClipboardCheck },
        { to: "/student/quizzes",      label: "Quizzes",     icon: ClipboardCheck },
        { to: "/student/notes",        label: "Notes",       icon: StickyNote },
      ],
    },
    {
      title: "Progress",
      links: [
        { to: "/student/mastery",      label: "Mastery",     icon: LineChart },
        { to: "/student/progress",     label: "Progress",    icon: LineChart },
        { to: "/student/retention",    label: "Retention",   icon: Sparkles },
        { to: "/student/recommendations", label: "For you",  icon: Sparkles },
        { to: "/student/leaderboard",  label: "Leaderboard", icon: Trophy },
      ],
    },
    {
      title: "Account",
      links: [
        { to: "/student/notifications",label: "Notifications", icon: Bell },
        { to: "/settings",             label: "Settings",      icon: Settings },
        ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as NavLink] : []),
      ],
    },
  ];
}

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {g.title}
          </div>
          <div className="space-y-0.5">
            {g.links.map((l) => (
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
          </div>
        </div>
      ))}
    </nav>
  );
}

function AuthLayout() {
  const auth = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = useNavGroups();

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
        <NavList groups={groups} />
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
              <NavList groups={groups} onNavigate={() => setMobileOpen(false)} />
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
