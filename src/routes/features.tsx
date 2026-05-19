import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Users, Check } from "lucide-react";
import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — SmartLab Online" },
      {
        name: "description",
        content:
          "Three intelligent pillars: AI personalized study plans, smart revision and concept mastery, and parent & teacher visibility.",
      },
      { property: "og:title", content: "Features — SmartLab Online" },
      {
        property: "og:description",
        content:
          "Personalized AI plans, spaced revision, and live parent-teacher dashboards for Classes 6–12 CBSE.",
      },
      { property: "og:url", content: "/features" },
    ],
    links: [{ rel: "canonical", href: "/features" }],
  }),
  component: FeaturesPage,
});

const BLOCKS = [
  {
    icon: Brain,
    eyebrow: "Pillar 01",
    title: "AI Personalized Study Plans",
    body: "Every student gets a study plan that adapts daily — based on their grade, syllabus pacing, school timetable, and the gaps the AI sees in their performance.",
    points: [
      "Daily tasks calibrated to each student's pace",
      "Auto-rebalances when topics get harder",
      "Aligned to CBSE syllabus for Classes 6–12",
      "Smart break scheduling to avoid burnout",
    ],
  },
  {
    icon: Sparkles,
    eyebrow: "Pillar 02",
    title: "Smart Revision & Concept Mastery",
    body: "Beyond practice questions — SmartLab tracks understanding at the concept level and uses spaced repetition to lock in retention before it fades.",
    points: [
      "Concept-level diagnostics, not just scores",
      "Spaced revision that targets weak topics",
      "Instant explanations for missed questions",
      "Mastery score for every chapter",
    ],
  },
  {
    icon: Users,
    eyebrow: "Pillar 03",
    title: "Parent & Teacher Visibility",
    body: "Parents and teachers see what's actually happening — progress, effort, and red flags — without nagging the student or guessing from marks alone.",
    points: [
      "Weekly progress reports auto-delivered",
      "Real-time alerts on missed sessions",
      "Teacher dashboard for classes & tuitions",
      "Goal tracking shared across the family",
    ],
  },
];

function FeaturesPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Features"
            title="One ecosystem. Three intelligent pillars."
            description="Each pillar solves a real problem in how Indian students study today — and together they turn effort into measurable progress."
            as="h1"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="space-y-28">
          {BLOCKS.map((b, i) => (
            <div
              key={b.title}
              className={`grid items-center gap-12 lg:grid-cols-2 ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="mb-5 inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-accent" />
                  <span className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
                    {b.eyebrow}
                  </span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {b.title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">{b.body}</p>
                <ul className="mt-7 space-y-3">
                  {b.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Check className="h-3 w-3" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-hero p-12 shadow-elegant">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.76_0.13_85_/_0.3),transparent_60%)]"
                  />
                  <div className="relative flex h-full flex-col justify-between text-cream">
                    <b.icon className="h-14 w-14 text-accent" />
                    <div>
                      <div className="font-display text-7xl font-semibold tracking-tight text-accent/80">
                        0{i + 1}
                      </div>
                      <div className="mt-2 font-display text-lg text-cream/80">{b.title}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="rounded-3xl border border-border bg-card p-12 text-center lg:p-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            See it in action.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            The fastest way to understand SmartLab is to experience it.
          </p>
          <div className="mt-7 flex justify-center">
            <CtaButton>Experience Smart Lab</CtaButton>
          </div>
        </div>
      </section>
    </>
  );
}
