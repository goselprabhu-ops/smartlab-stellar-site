import { createFileRoute } from "@tanstack/react-router";
import { Bell, Sparkles, Trophy, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/student/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Smart Lab Online" }] }),
  component: NotificationsPage,
});

const items = [
  { icon: Sparkles, type: "AI", title: "Your remediation pack is ready", body: "We rebuilt your weak-area sheet for 'Polynomials'.", time: "5 min ago", unread: true },
  { icon: Clock,    type: "Revision", title: "3 concepts due for review today", body: "Forgetting risk is high on Light · Reflection.", time: "1 hr ago", unread: true },
  { icon: Trophy,   type: "Achievement", title: "Unlocked: 12-day streak", body: "Keep going to reach the next badge.", time: "Yesterday", unread: false },
  { icon: Bell,     type: "Reminder", title: "Math diagnostic scheduled for tomorrow", body: "20 minutes · 12 questions · Adaptive.", time: "Yesterday", unread: false },
];

function NotificationsPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Inbox</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">AI nudges, revision reminders, and achievements — all in one place.</p>
        </div>
        <Button variant="outline" size="sm"><CheckCheck className="size-4" /> Mark all read</Button>
      </header>

      <ul className="overflow-hidden rounded-2xl border bg-card elev-2">
        {items.map((n, i) => (
          <li key={i} className={`flex items-start gap-4 border-b p-4 last:border-0 ${n.unread ? "bg-primary/5" : ""}`}>
            <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full">
              <n.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                {n.unread && <span className="bg-primary inline-block size-1.5 rounded-full" aria-label="Unread" />}
              </div>
              <h2 className="mt-1 text-sm font-semibold">{n.title}</h2>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
