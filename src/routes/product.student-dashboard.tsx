import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Flame, Trophy, Brain, BookOpen, Calendar, BellRing, Sparkles } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/student-dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Smart Lab Online" },
      { name: "description", content: "A calm, focused dashboard that shows today's plan, streaks, and progress — without overwhelm." },
      { property: "og:title", content: "Student Dashboard — Smart Lab Online" },
      { property: "og:description", content: "The home screen students actually want to open." },
    ],
  }),
  component: StudentDashboardMarketing,
});

function DashboardPreview() {
  return (
    <div className="bg-background rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Good evening, Mira</div>
          <div className="font-display mt-1 text-xl font-semibold">3 sessions today · 42 min</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-warning/15 text-warning inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <Flame className="size-3.5" /> 12-day streak
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Today's plan",      value: "3 of 4 done",  icon: Calendar },
          { label: "Concept mastery",   value: "+8 this week", icon: Brain },
          { label: "Next revision",     value: "In 20 min",    icon: BellRing },
        ].map((c) => (
          <div key={c.label} className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
              <c.icon className="size-3" /> {c.label}
            </div>
            <div className="mt-1 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-dashed p-3 text-xs">
        <span className="text-primary font-medium">AI nudge · </span>
        You're 1 session away from unlocking the &quot;Geometry streak&quot; badge. Keep going.
      </div>
    </div>
  );
}

function StudentDashboardMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Student Dashboard"
      title={<>The home screen students <span className="text-accent">actually want to open</span>.</>}
      description="Today's plan, streaks, mastery, and gentle nudges — designed for focus, not anxiety."
      primaryCta={{ label: "See the dashboard", to: "/demo" }}
      secondaryCta={{ label: "Open the app", to: "/login" }}
      heroVisual={<DashboardPreview />}
      explanation={{
        title: "Calm by design",
        body: "Most edtech dashboards overwhelm. Ours surfaces only what matters today — the next session, the current streak, the one nudge worth acting on.",
        bullets: [
          "One clear 'what to do next' at all times",
          "Streaks and badges that reward consistency, not cramming",
          "AI nudges that respect focus and quiet hours",
          "Quick access to AI tutor, notes, and tests",
          "Mobile-first — works on every phone",
        ],
      }}
      preview={{
        title: "A typical evening view",
        description: "Three sessions today, a 12-day streak, one AI nudge. That's the whole homepage.",
        node: <DashboardPreview />,
      }}
      benefits={[
        { icon: LayoutDashboard, title: "Single source of truth", description: "Plan, progress, and reminders in one calm view." },
        { icon: Flame, title: "Streaks that motivate", description: "Built on behavioral science, not dopamine traps." },
        { icon: Trophy, title: "Meaningful rewards", description: "Badges tied to mastery, not minutes spent." },
        { icon: BookOpen, title: "One-tap access", description: "Tutor, notes, tests — always one tap away." },
        { icon: BellRing, title: "Respectful nudges", description: "Quiet hours, no notification spam." },
        { icon: Sparkles, title: "Daily AI nudge", description: "One actionable suggestion per day." },
      ]}
      outcomes={[
        { stat: "+41%", label: "7-day return rate" },
        { stat: "+27%", label: "Daily session completion" },
        { stat: "12 d", label: "Median streak", sub: "Active students" },
        { stat: "4.8 / 5", label: "Student NPS" },
      ]}
      comparison={{
        theirsLabel: "Generic EdTech apps",
        rows: [
          { label: "One clear next action", us: true, them: false },
          { label: "Streak system tied to mastery", us: true, them: false },
          { label: "Quiet-hours notifications", us: true, them: false },
          { label: "Mobile-first design", us: true, them: "Mixed" },
          { label: "AI nudges (max 1/day)", us: true, them: false },
        ],
      }}
    />
  );
}
