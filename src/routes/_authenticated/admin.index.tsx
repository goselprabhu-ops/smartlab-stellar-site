import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminMetrics } from "@/lib/admin.functions";
import { Users, BookOpen, ClipboardCheck, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const m = useServerFn(adminMetrics);
  const metrics = useQuery({ queryKey: ["admin-metrics"], queryFn: () => m() });

  const cards = [
    { k: "Users",    v: metrics.data?.users,    icon: Users },
    { k: "Courses",  v: metrics.data?.courses,  icon: BookOpen },
    { k: "Quizzes",  v: metrics.data?.quizzes,  icon: ClipboardCheck },
    { k: "Attempts", v: metrics.data?.attempts, icon: Activity },
  ];

  return (
    <section className="space-y-6">
      <h2 className="font-display text-lg font-semibold">Platform overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.k} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <s.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.k}</div>
            <div className="font-display text-3xl font-semibold">{s.v ?? "—"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
