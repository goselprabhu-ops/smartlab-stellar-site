import { createFileRoute } from "@tanstack/react-router";
import { Home, BookOpen, Sparkles, BarChart3, Bell, Clock, Trophy } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const TABS: MobileTab[] = [
  { to: "/m/student", label: "Home", icon: Home },
  { to: "/m/learn", label: "Learn", icon: BookOpen },
  { to: "/m/tutor", label: "Tutor", icon: Sparkles },
  { to: "/m/progress", label: "Progress", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/m/inbox")({
  component: MobileInbox,
});

const items = [
  { icon: Sparkles, title: "Your remediation pack is ready", body: "Polynomials weak-area sheet rebuilt.", time: "5m" },
  { icon: Clock, title: "3 concepts due for review", body: "Forgetting risk: Light · Reflection.", time: "1h" },
  { icon: Trophy, title: "12-day streak unlocked", body: "Keep going to reach the next badge.", time: "1d" },
];

function MobileInbox() {
  const { status, request, supported } = usePushNotifications();
  return (
    <MobileShell title="Inbox" tabs={TABS}>
      {supported && status !== "granted" && (
        <div className="mb-3 flex items-center justify-between rounded-xl border bg-primary/5 p-3">
          <div className="text-xs">
            <div className="font-semibold">Turn on push reminders</div>
            <div className="text-muted-foreground">Get nudged for revisions and streaks.</div>
          </div>
          <Button size="sm" onClick={() => request()}>Enable</Button>
        </div>
      )}
      <ul className="overflow-hidden rounded-2xl border bg-card">
        {items.map((n, i) => (
          <li key={i} className="flex items-start gap-3 border-b p-3 last:border-0">
            <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full">
              <n.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{n.time}</span>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
