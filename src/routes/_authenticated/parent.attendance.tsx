import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Parent · Smart Lab Online" }] }),
  component: AttendancePage,
});

// Last 28 days, fake but realistic study attendance
const days = Array.from({ length: 28 }, (_, i) => {
  const seed = (i * 7 + 3) % 11;
  return { day: i + 1, minutes: seed === 0 ? 0 : 15 + seed * 9 };
});

function colorFor(min: number) {
  if (min === 0) return "bg-muted";
  if (min < 30) return "bg-primary/20";
  if (min < 60) return "bg-primary/45";
  if (min < 90) return "bg-primary/70";
  return "bg-primary";
}

function AttendancePage() {
  const present = days.filter((d) => d.minutes > 0).length;
  const totalMin = days.reduce((s, d) => s + d.minutes, 0);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Study attendance · Last 28 days</h2>
        <p className="mt-1 text-sm text-muted-foreground">Days your child actively studied on Smart Lab Online.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarCheck, label: "Active days", value: `${present} / 28` },
          { icon: Clock,         label: "Total study time", value: `${Math.round(totalMin / 60)}h ${totalMin % 60}m` },
          { icon: Flame,         label: "Current streak", value: "12 days" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 elev-2">
            <s.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 elev-2">
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => (
            <div
              key={d.day}
              className={`aspect-square rounded-md ${colorFor(d.minutes)}`}
              title={`Day ${d.day}: ${d.minutes} min`}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {["bg-muted", "bg-primary/20", "bg-primary/45", "bg-primary/70", "bg-primary"].map((c) => (
            <span key={c} className={`size-3 rounded ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
