import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Brain, LineChart, Users } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartLab Online — AI Learning for Classes 6–12 CBSE" },
      {
        name: "description",
        content:
          "SmartLab Online is an AI-powered learning ecosystem that transforms studying into measurable academic progress through personalized plans, smart revision, and concept mastery.",
      },
      { property: "og:title", content: "SmartLab Online — AI Learning for Classes 6–12 CBSE" },
      {
        property: "og:description",
        content:
          "Personalized study plans, smart revision, and parent-teacher visibility — built for CBSE students Grades 6–12.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: Brain,
    title: "AI Personalized Study Plans",
    body: "Daily plans calibrated to each student's pace, gaps, and exam timeline.",
  },
  {
    icon: Sparkles,
    title: "Smart Revision & Concept Mastery",
    body: "Spaced revision and concept-level diagnostics that lock in long-term recall.",
  },
  {
    icon: Users,
    title: "Parent & Teacher Visibility",
    body: "Live progress dashboards so the right adults can step in at the right time.",
  },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-cream">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(0.76_0.13_85_/_0.18),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36 lg:px-10 lg:py-44">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium tracking-wide text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered learning ecosystem
            </div>
            <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Transform studying into{" "}
              <span className="bg-gradient-to-r from-accent to-[oklch(0.85_0.14_85)] bg-clip-text text-transparent">
                intelligent progress.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-cream/75 sm:text-xl">
              SmartLab Online is an AI-powered learning ecosystem for Classes 6–12 CBSE —
              personalized plans, smart revision, and concept-level mastery, all in one place.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <CtaButton>Experience Smart Lab</CtaButton>
              <CtaButton variant="secondary" className="text-cream">
                Book a Free Smart Learning Demo
              </CtaButton>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-cream/50">
              <span>Classes 6 – 12 CBSE</span>
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              <span>Strongest fit Grades 8 – 10</span>
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              <span>Parents · Schools · Tuitions</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE TEASER */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="What you get"
          title="An ecosystem, not just an app."
          description="Three intelligent pillars working together to turn studying into measurable progress."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elegant"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
          >
            Explore all features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* STAT / PROOF STRIP */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-3 lg:px-10">
          {[
            { k: "AI-led", v: "Daily plans adapt to each student's pace" },
            { k: "Concept-deep", v: "Mastery tracked at the topic level" },
            { k: "Family-wide", v: "Parents and teachers stay in the loop" },
          ].map((s) => (
            <div key={s.k}>
              <div className="font-display text-3xl font-semibold text-foreground">{s.k}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            align="left"
            eyebrow="Plans"
            title="Built for every learner, every family."
            description="From a focused starter plan to full premium access for serious board-exam prep. Annual billing saves 20%."
          />
          <div className="grid gap-4">
            {[
              { name: "Starter", price: "₹499", tag: "Core daily plan" },
              { name: "Smart Plus", price: "₹999", tag: "Most popular · Smart revision" },
              { name: "Premium Pro", price: "₹1999", tag: "Full mastery + parent insights" },
            ].map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5"
              >
                <div>
                  <div className="font-display text-base font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.tag}</div>
                </div>
                <div className="font-display text-xl font-semibold text-foreground">
                  {t.price}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </div>
              </div>
            ))}
            <Link
              to="/pricing"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              Compare plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center text-cream lg:p-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.76_0.13_85_/_0.25),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <LineChart className="mx-auto mb-6 h-8 w-8 text-accent" />
            <h2 className="text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Ready to see measurable progress?
            </h2>
            <p className="mt-4 text-cream/70">
              Start a free Smart Learning demo — see how AI personalization changes your study week.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaButton>Experience Smart Lab</CtaButton>
              <CtaButton variant="secondary" className="text-cream">
                Book a Free Demo
              </CtaButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
