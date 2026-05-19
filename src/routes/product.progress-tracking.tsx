import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Activity, Eye, BellRing, BarChart3, GitBranch, Target, Sparkles } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";
import { Sparkline } from "@/components/ui/sparkline";

export const Route = createFileRoute("/product/progress-tracking")({
  head: () => ({
    meta: [
      { title: "Progress Tracking — Smart Lab Online" },
      { name: "description", content: "Track mastery, streaks, and skill growth per subject and concept — for students, parents, and teachers." },
      { property: "og:title", content: "Progress Tracking — Smart Lab Online" },
      { property: "og:description", content: "See every student's growth, concept by concept." },
    ],
  }),
  component: ProgressMarketing,
});

function ProgressPreview() {
  const subjects = [
    { name: "Mathematics", mastery: 78, trend: [40, 48, 55, 62, 70, 78], delta: "+12 this week" },
    { name: "Science",     mastery: 84, trend: [50, 58, 62, 70, 80, 84], delta: "+8 this week" },
    { name: "English",     mastery: 66, trend: [55, 60, 58, 62, 64, 66], delta: "+4 this week" },
    { name: "Social",      mastery: 71, trend: [45, 50, 55, 60, 68, 71], delta: "+11 this week" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subjects.map((s) => (
        <div key={s.name} className="bg-background rounded-xl border p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.name}</div>
              <div className="font-display mt-1 text-2xl font-semibold">{s.mastery}%</div>
            </div>
            <span className="text-success text-xs font-medium">{s.delta}</span>
          </div>
          <div className="mt-2">
            <Sparkline data={s.trend} className="h-10 w-full text-primary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Progress Tracking"
      title={<>See growth, <span className="text-accent">concept by concept</span>.</>}
      description="Granular tracking of mastery, streaks, and confidence across every chapter — so progress is never a mystery."
      primaryCta={{ label: "See the dashboard", to: "/demo" }}
      secondaryCta={{ label: "Parent view", to: "/product/parent-dashboard" }}
      heroVisual={<ProgressPreview />}
      explanation={{
        title: "Mastery as a number you can trust",
        body: "Every concept gets a calibrated mastery score that blends accuracy, recall, and retention — not just last test marks.",
        bullets: [
          "Per-concept mastery for every chapter (Classes 6–12, CBSE)",
          "Streaks, weekly deltas, and forecasted exam readiness",
          "Drill from subject → chapter → concept → question",
          "Shared with parents and teachers in real time",
          "Triggers smart nudges when a student is stalling",
        ],
      }}
      preview={{
        title: "A live student view",
        description: "Four subjects, weekly trend, deltas — the kind of clarity students and parents actually want.",
        node: <ProgressPreview />,
      }}
      benefits={[
        { icon: TrendingUp, title: "Visible growth", description: "Students see their progress climb week by week." },
        { icon: Activity, title: "Real signal", description: "Mastery scores backed by recall and retention, not just clicks." },
        { icon: Eye, title: "Parents in the loop", description: "Shared visibility, without surveillance." },
        { icon: BellRing, title: "Smart nudges", description: "Triggers when streaks drop or mastery stalls." },
        { icon: BarChart3, title: "Trends over time", description: "Weekly and monthly views, per subject." },
        { icon: Target, title: "Goal-linked", description: "Mastery rolls up to exam-readiness scores." },
      ]}
      outcomes={[
        { stat: "+31%", label: "Weekly study consistency" },
        { stat: "2.4×", label: "Parents' confidence in progress" },
        { stat: "−38%", label: "'Surprises' at report card time" },
        { stat: "100%", label: "Concepts tracked individually" },
      ]}
      comparison={{
        theirsLabel: "Marks-only tracking",
        rows: [
          { label: "Per-concept mastery score", us: true, them: false },
          { label: "Backed by retention model", us: true, them: false },
          { label: "Real-time updates", us: true, them: "Term-end" },
          { label: "Shared with parents live", us: true, them: false },
          { label: "Trigger-based nudges", us: true, them: false },
        ],
      }}
    />
  );
}
