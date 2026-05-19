import { createFileRoute } from "@tanstack/react-router";
import { UserCircle2, Wand2, Brain, Sparkles, GitBranch, BookOpen, Layers, Target } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/personalized-learning")({
  head: () => ({
    meta: [
      { title: "Personalized Learning — Smart Lab Online" },
      { name: "description", content: "Content, pacing, and practice tuned to every student — automatically, in real time." },
      { property: "og:title", content: "Personalized Learning — Smart Lab Online" },
      { property: "og:description", content: "An adaptive engine that makes every student feel like the curriculum was written for them." },
    ],
  }),
  component: PersonalizedMarketing,
});

function PersonaPreview() {
  const cards = [
    { name: "Aarav · Class 9", style: "Visual learner", focus: "Geometry weak · Algebra strong", pace: "Faster" },
    { name: "Mira · Class 7",  style: "Reads-then-does", focus: "Strong reader · Hesitant in maths", pace: "Steady" },
    { name: "Ishan · Class 11", style: "Practice-heavy", focus: "Physics goal: 95+", pace: "Intensive" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.name} className="bg-background rounded-xl border p-4">
          <div className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-full">
            <UserCircle2 className="size-5" />
          </div>
          <div className="mt-2 text-sm font-semibold">{c.name}</div>
          <div className="text-muted-foreground mt-0.5 text-xs">{c.style}</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div><span className="text-muted-foreground">Focus · </span>{c.focus}</div>
            <div><span className="text-muted-foreground">Pace · </span>{c.pace}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonalizedMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Personalized Learning"
      title={<>A curriculum that <span className="text-accent">bends to the student</span>.</>}
      description="Pacing, examples, difficulty, and even tone — tuned per student. Personalization happens automatically, every session."
      primaryCta={{ label: "Experience it", to: "/demo" }}
      secondaryCta={{ label: "Inside the AI engine", to: "/ai-learning" }}
      heroVisual={<PersonaPreview />}
      explanation={{
        title: "Three students, three completely different journeys",
        body: "Smart Lab Online builds a learning profile per student — strengths, gaps, style, pace — and reshapes the entire experience around it.",
        bullets: [
          "Adaptive difficulty on every quiz and practice item",
          "Examples chosen to match the student's interests",
          "Pacing tuned to attention span and exam timelines",
          "Remediation auto-generated for each weak area",
          "Tone calibrated for grade and confidence",
        ],
      }}
      preview={{
        title: "Three personas, same platform",
        description: "Same chapter, but each student sees a different first question, example, and follow-up.",
        node: <PersonaPreview />,
      }}
      benefits={[
        { icon: Wand2, title: "Made-for-me feel", description: "Students report 'it actually gets me.'" },
        { icon: Brain, title: "Less wasted time", description: "Skip what's mastered, focus on real gaps." },
        { icon: Target, title: "Goal-driven", description: "Tied to each student's exam targets." },
        { icon: GitBranch, title: "Branching paths", description: "Different routes through the same chapter." },
        { icon: BookOpen, title: "On-demand notes", description: "Simplified or expanded based on need." },
        { icon: Layers, title: "Mixed modalities", description: "Reads, watches, solves — based on what works." },
      ]}
      outcomes={[
        { stat: "+34%", label: "Engagement vs. one-size content" },
        { stat: "1.8×", label: "Speed to first mastery" },
        { stat: "89%", label: "Students prefer it to standard apps" },
        { stat: "0", label: "Manual setup required" },
      ]}
      comparison={{
        theirsLabel: "Standard apps",
        rows: [
          { label: "Adapts on every question", us: true, them: false },
          { label: "Per-student learning profile", us: true, them: false },
          { label: "AI-generated remediation", us: true, them: false },
          { label: "Tone & pacing per student", us: true, them: false },
          { label: "Setup time", us: "Zero", them: "Manual" },
        ],
      }}
    />
  );
}
