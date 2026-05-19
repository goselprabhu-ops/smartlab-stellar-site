import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/parent/analytics")({
  head: () => ({ meta: [{ title: "Performance Analytics — Parent · Smart Lab Online" }] }),
  component: AnalyticsPage,
});

const subjects = [
  { name: "Mathematics",    mastery: 72, delta: 6,  trend: "up" as const },
  { name: "Science",        mastery: 58, delta: -3, trend: "down" as const },
  { name: "Social Studies", mastery: 64, delta: 2,  trend: "up" as const },
  { name: "English",        mastery: 81, delta: 4,  trend: "up" as const },
  { name: "Hindi",          mastery: 49, delta: -1, trend: "down" as const },
];

const insights = [
  "Strongest area: English vocabulary and grammar (+4% this week).",
  "Watch area: Newton's laws — accuracy dropped 12% in the latest quiz.",
  "Best study window: 6–8 pm. 38% higher recall than morning sessions.",
  "Recommended next: 20 min revision on Hindi grammar before Sunday's test.",
];

function AnalyticsPage() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold">Performance analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mastery, momentum, and AI insights for the last 30 days.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 elev-2">
        <h3 className="text-sm font-semibold">Mastery by subject</h3>
        <ul className="mt-4 space-y-4">
          {subjects.map((s) => (
            <li key={s.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className={s.trend === "up" ? "text-success" : "text-destructive"}>
                    {s.trend === "up" ? <TrendingUp className="size-4 inline" /> : <TrendingDown className="size-4 inline" />}{" "}
                    {s.delta > 0 ? "+" : ""}{s.delta}%
                  </span>
                  <span className="font-mono w-10 text-right">{s.mastery}%</span>
                </div>
              </div>
              <Progress value={s.mastery} />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-gradient-soft p-6 elev-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          <h3 className="text-sm font-semibold">AI insights</h3>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {insights.map((i) => <li key={i}>· {i}</li>)}
        </ul>
      </div>
    </section>
  );
}
