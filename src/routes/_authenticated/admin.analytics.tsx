import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Activity, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

const kpis = [
  { icon: Users,    label: "Daily active",   value: "2,418", trend: "+12%" },
  { icon: TrendingUp, label: "Mastery gain (avg)", value: "+4.6%", trend: "vs last week" },
  { icon: Activity, label: "Quiz attempts",  value: "18,920", trend: "last 7d" },
  { icon: Clock,    label: "Avg session",    value: "27 min", trend: "+3 min" },
];

const bars = [40, 52, 48, 61, 73, 68, 82, 90, 84, 95, 88, 102];

function AdminAnalytics() {
  const max = Math.max(...bars);
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Platform analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Engagement, learning, and AI-usage signals across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <k.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
            <div className="font-display text-3xl font-semibold">{k.value}</div>
            <div className="mt-1 text-xs text-success">{k.trend}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 elev-2">
        <h3 className="text-sm font-semibold">Quiz attempts · last 12 weeks</h3>
        <div className="mt-6 flex h-48 items-end gap-2">
          {bars.map((b, i) => (
            <div
              key={i}
              className="bg-gradient-brand flex-1 rounded-t-md transition-all hover:opacity-80"
              style={{ height: `${(b / max) * 100}%` }}
              title={`W${i + 1}: ${b * 100}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          {bars.map((_, i) => <span key={i}>W{i + 1}</span>)}
        </div>
      </div>
    </section>
  );
}
