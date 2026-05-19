import { createFileRoute } from "@tanstack/react-router";
import { Eye, Heart, MessageCircle, BellRing, FileText, ShieldCheck, Calendar, BarChart3 } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/parent-dashboard")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — Smart Lab Online" },
      { name: "description", content: "Real-time visibility into your child's learning — without turning into a surveillance tool." },
      { property: "og:title", content: "Parent Dashboard — Smart Lab Online" },
      { property: "og:description", content: "Calm, honest progress updates for parents." },
    ],
  }),
  component: ParentDashboardMarketing,
});

function ParentPreview() {
  return (
    <div className="bg-background rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Aarav · Class 9 · this week</div>
          <div className="font-display mt-1 text-xl font-semibold">On track</div>
        </div>
        <span className="bg-success/15 text-success rounded-full px-2.5 py-1 text-xs font-medium">+3 vs last week</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Hours studied",   value: "6h 20m"   },
          { label: "Concepts mastered", value: "9 new"  },
          { label: "Test readiness",  value: "82%"     },
        ].map((c) => (
          <div key={c.label} className="bg-muted/40 rounded-lg p-3">
            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{c.label}</div>
            <div className="mt-1 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 text-xs">
        <div className="text-muted-foreground font-medium uppercase tracking-wider">This week's note</div>
        <p className="leading-relaxed">
          Aarav had a strong week in Physics (light & refraction). Geometry is stalling — the AI tutor has queued 3 short revision sessions before Friday's test.
        </p>
      </div>
    </div>
  );
}

function ParentDashboardMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Parent Dashboard"
      title={<>Stay close, <span className="text-accent">not on top</span>.</>}
      description="A weekly view of your child's progress, written in plain language — with privacy and trust built in."
      primaryCta={{ label: "See the parent view", to: "/demo" }}
      secondaryCta={{ label: "Schools & tuitions", to: "/schools" }}
      heroVisual={<ParentPreview />}
      explanation={{
        title: "Visibility, not surveillance",
        body: "We summarize the week in language any parent can understand — strengths, stalls, and what the AI is doing about it.",
        bullets: [
          "Plain-language weekly summary (no chart-reading required)",
          "Per-subject test-readiness scores",
          "Alerts only when something actually needs attention",
          "Privacy-first — students see what parents see",
          "Direct line to teachers when needed",
        ],
      }}
      preview={{
        title: "This week's summary",
        description: "Real numbers, plus a calm paragraph explaining what's happening and what's queued.",
        node: <ParentPreview />,
      }}
      benefits={[
        { icon: Heart, title: "Calmer conversations", description: "No more 'how was school?' interrogations." },
        { icon: Eye, title: "Honest visibility", description: "What's working, what's not, what's next." },
        { icon: BellRing, title: "Smart alerts", description: "Notified only when it actually matters." },
        { icon: FileText, title: "Term reports", description: "Auto-generated reports for parent-teacher meetings." },
        { icon: MessageCircle, title: "Teacher channel", description: "Direct, in-context messaging." },
        { icon: ShieldCheck, title: "Privacy first", description: "Students see exactly what you see." },
      ]}
      outcomes={[
        { stat: "−54%", label: "Parent–child study arguments", sub: "Pilot survey" },
        { stat: "4.7 / 5", label: "Parent satisfaction" },
        { stat: "2.4×", label: "Faster teacher feedback loops" },
        { stat: "Weekly", label: "Plain-language summary" },
      ]}
      comparison={{
        theirsLabel: "Marks-only apps",
        rows: [
          { label: "Plain-language weekly summary", us: true, them: false },
          { label: "Test-readiness forecast", us: true, them: false },
          { label: "Smart alerts (not spam)", us: true, them: false },
          { label: "Direct teacher messaging", us: true, them: false },
          { label: "Student-visible (no surveillance)", us: true, them: false },
        ],
      }}
    />
  );
}
