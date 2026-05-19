import { createFileRoute } from "@tanstack/react-router";
import { Target, Compass, Users } from "lucide-react";
import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SmartLab Online" },
      {
        name: "description",
        content:
          "SmartLab Online's mission: transform studying into intelligent progress for every CBSE student in Classes 6–12.",
      },
      { property: "og:title", content: "About — SmartLab Online" },
      {
        property: "og:description",
        content:
          "Why we built an AI learning ecosystem that turns effort into measurable academic growth.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.76_0.13_85_/_0.2),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2">
              <span className="h-px w-8 bg-accent" />
              <span className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
                About
              </span>
            </div>
            <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              We{" "}
              <span className="bg-gradient-to-r from-accent to-[oklch(0.85_0.14_85)] bg-clip-text text-transparent">
                transform studying
              </span>{" "}
              into intelligent progress.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-cream/75">
              SmartLab Online exists because effort doesn't always translate into outcomes.
              Students study hard but plateau. Parents care but can't tell what's working.
              Teachers do their best but lack the bandwidth to personalize for every learner.
              We built an AI ecosystem that fixes all three at once.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="Mission"
          title="Measurable academic progress, not just more hours."
          description="We believe modern learning should be personal, transparent, and proven — backed by AI that respects how students actually think."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "Personal",
              body: "Every learner gets a plan calibrated to their pace, gaps, and goals — not a one-size-fits-all timetable.",
            },
            {
              icon: Compass,
              title: "Transparent",
              body: "Parents and teachers see real signals, not just marks — so they can support at the right moment.",
            },
            {
              icon: Users,
              title: "Proven",
              body: "Concept-level mastery tracking means progress is observable, not aspirational.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-border bg-card p-7 transition-all hover:border-accent/40 hover:shadow-elegant"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-accent">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">{v.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="rounded-3xl border border-border bg-card p-12 lg:p-16">
          <SectionHeading
            align="left"
            eyebrow="Who we serve"
            title="Built for Classes 6 – 12 CBSE."
            description="Strongest fit for Grades 8 – 10, where the foundation for boards is laid. Loved by parents who want clarity and by tuitions and schools that want scale without losing the personal touch."
          />
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              "Students Classes 6–12",
              "CBSE-aligned",
              "Parents",
              "Schools",
              "Tuition centres",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center text-cream lg:p-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Experience the difference yourself.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/70">
            Step inside the SmartLab ecosystem — see how AI personalization changes a study week.
          </p>
          <div className="mt-7 flex justify-center">
            <CtaButton>Experience Smart Lab</CtaButton>
          </div>
        </div>
      </section>
    </>
  );
}
