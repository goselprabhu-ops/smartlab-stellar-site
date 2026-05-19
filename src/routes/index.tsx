import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Brain,
  LineChart,
  Users,
  Target,
  BookOpen,
  Trophy,
  School,
  ShieldCheck,
  Zap,
  Bot,
  GraduationCap,
  TrendingUp,
  Clock,
  Heart,
  CheckCircle2,
  Star,
  PlayCircle,
  Layers,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";
import { GradientCard } from "@/components/ui/gradient-card";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Lab Online — AI Learning for Classes 6–12 CBSE" },
      {
        name: "description",
        content:
          "AI-powered learning ecosystem for CBSE Classes 6–12. Personalized study paths, smart revision, instant AI tutoring, and real progress visibility for students, parents, and schools.",
      },
      { property: "og:title", content: "Smart Lab Online — AI Learning for Classes 6–12 CBSE" },
      {
        property: "og:description",
        content:
          "Personalized AI study plans, smart revision, and parent-teacher dashboards — built for CBSE students Grades 6–12.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Smart Lab Online",
          description:
            "AI-powered learning platform for CBSE Classes 6–12 by Gosel Global Holdings.",
        }),
      },
    ],
  }),
  component: Home,
});

/* -------------------------------------------------------------------------- */
/*  Section 1 — Hero (with animated dashboard preview)                        */
/* -------------------------------------------------------------------------- */

function HeroDashboardPreview() {
  return (
    <div className="relative">
      {/* Floating blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-primary-glow/30 blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative rounded-3xl border border-cream/10 bg-gradient-to-br from-cream/[0.08] to-cream/[0.02] p-3 backdrop-blur-xl shadow-2xl">
        <div className="rounded-2xl bg-ink/80 p-5 ring-1 ring-cream/5">
          {/* fake window chrome */}
          <div className="mb-4 flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <div className="ml-3 text-[10px] uppercase tracking-widest text-cream/40">
              smartlab.app / dashboard
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Mastery", value: "87%", trend: "+12%" },
              { label: "Streak", value: "24d", trend: "+3" },
              { label: "Rank", value: "#14", trend: "↑6" },
            ].map((k, i) => (
              <div
                key={k.label}
                className="rounded-xl border border-cream/10 bg-cream/5 p-3 animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="text-[10px] uppercase tracking-widest text-cream/40">
                  {k.label}
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-cream">
                  {k.value}
                </div>
                <div className="text-xs text-accent">{k.trend}</div>
              </div>
            ))}
          </div>

          {/* Sparkline panel */}
          <div className="mt-4 rounded-xl border border-cream/10 bg-cream/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium text-cream/70">Weekly progress</div>
              <div className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                Live
              </div>
            </div>
            <Sparkline
              data={[12, 18, 14, 24, 32, 28, 41, 38, 52, 48, 61, 68]}
              className="h-16 w-full text-accent"
            />
          </div>

          {/* AI tutor chip */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 animate-fade-in" style={{ animationDelay: "500ms" }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 text-xs text-cream/80">
              <span className="font-medium text-cream">AI Tutor:</span> Found 3 weak
              concepts in Trigonometry — building a revision plan…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-cream">
      {/* animated grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.85_0.14_85)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.14_85)_1px,transparent_1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,oklch(0.76_0.13_85_/_0.22),transparent_55%)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:py-36">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium tracking-wide text-accent animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            India's first AI-first learning OS for CBSE
          </div>
          <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in" style={{ animationDelay: "100ms" }}>
            Learn smarter.{" "}
            <span className="bg-gradient-to-r from-accent via-[oklch(0.85_0.14_85)] to-accent bg-clip-text text-transparent">
              Score higher.
            </span>{" "}
            Powered by AI.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream/75 sm:text-xl animate-fade-in" style={{ animationDelay: "200ms" }}>
            Smart Lab Online builds a personal learning path for every CBSE student
            (Classes 6–12) — adaptive lessons, AI tutoring, smart revision, and parent
            visibility, all in one beautifully connected platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CtaButton>
              Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
            </CtaButton>
            <CtaButton variant="secondary" className="text-cream">
              <PlayCircle className="mr-2 h-4 w-4" /> Watch 2-min Demo
            </CtaButton>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-cream/50">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> CBSE-aligned</span>
            <span className="h-1 w-1 rounded-full bg-accent/60" />
            <span>50,000+ learners</span>
            <span className="h-1 w-1 rounded-full bg-accent/60" />
            <span>4.8 ★ avg rating</span>
          </div>
        </div>

        <div className="relative">
          <HeroDashboardPreview />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 2 — Trusted Learning Platform (logo strip + trust badges)         */
/* -------------------------------------------------------------------------- */

function TrustSection() {
  const stats = [
    { value: "50K+", label: "Active learners" },
    { value: "120+", label: "Partner schools" },
    { value: "4.8★", label: "Avg parent rating" },
    { value: "98%", label: "Concept retention" },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Trusted by students, parents & schools across India
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-semibold text-foreground">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 3 — AI Features                                                    */
/* -------------------------------------------------------------------------- */

function AIFeaturesSection() {
  const items = [
    {
      icon: Bot,
      title: "24/7 AI Tutor",
      body: "Ask anything — get step-by-step explanations, worked examples, and concept maps instantly.",
    },
    {
      icon: Brain,
      title: "Weakness Detection",
      body: "AI scans every test to spot weak micro-concepts before they snowball into low marks.",
    },
    {
      icon: Zap,
      title: "Auto Revision Engine",
      body: "Forgetting-curve-based scheduling ensures the right concept resurfaces at the right time.",
    },
    {
      icon: Layers,
      title: "Smart Notes & Flashcards",
      body: "AI compresses long chapters into clean notes, flashcards, and micro-tests in seconds.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="AI Features"
        title="Your personal AI study companion."
        description="Six intelligent engines working silently in the background — so every student gets a private tutor experience at scale."
      />
      <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {items.map((f, i) => (
          <GradientCard
            key={f.title}
            tone={i % 2 === 0 ? "brand" : "soft"}
            className="p-6 animate-fade-in"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-accent">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </GradientCard>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 4 — Personalized Learning                                          */
/* -------------------------------------------------------------------------- */

function PersonalizedSection() {
  return (
    <section className="bg-gradient-to-b from-card to-background py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center lg:px-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <Target className="h-3.5 w-3.5" /> Personalization
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            One platform.{" "}
            <span className="text-accent">A million personal paths.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Every learner gets a unique daily plan calibrated to their pace, gaps,
            confidence level, and exam timeline. No two students see the same screen.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Adaptive daily plan — adjusts every 24 hours",
              "Confidence-based pacing per subject",
              "Goal-aligned revision (boards, JEE foundation, Olympiad)",
              "Mood & energy aware scheduling",
            ].map((x) => (
              <li key={x} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
            <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
              Today's plan · Aarav, Class 9
            </div>
            <div className="space-y-3">
              {[
                { t: "Algebra · Linear equations", m: "25 min", tag: "Focus" },
                { t: "Physics · Motion review", m: "15 min", tag: "Revision" },
                { t: "English · Comprehension drill", m: "10 min", tag: "Quick" },
                { t: "AI flashcards · Biology", m: "8 min", tag: "Recall" },
              ].map((row, i) => (
                <div
                  key={row.t}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover-lift"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <div className="text-sm font-medium text-foreground">{row.t}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      {row.tag}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.m}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 5 — Progress Tracking                                              */
/* -------------------------------------------------------------------------- */

function ProgressSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Mastery trend
                </div>
                <div className="mt-1 font-display text-3xl font-semibold text-foreground">
                  +28% <span className="text-sm font-normal text-muted-foreground">in 30 days</span>
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div className="mt-6">
              <Sparkline
                data={[20, 22, 28, 26, 34, 38, 41, 45, 48, 55, 60, 68]}
                className="h-28 w-full text-accent"
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { l: "Math", v: 88 },
                { l: "Science", v: 74 },
                { l: "English", v: 92 },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                  <div className="mt-1 font-display text-xl font-semibold text-foreground">
                    {s.v}%
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${s.v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <LineChart className="h-3.5 w-3.5" /> Progress Tracking
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            See progress that's{" "}
            <span className="text-accent">actually measurable.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Concept-level analytics replace vague report cards. Every micro-skill is
            graded, every gap is named, every win is celebrated.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Topic mastery heatmaps",
              "Predicted exam scores updated weekly",
              "Confidence vs. accuracy reports",
              "Shareable progress timelines",
            ].map((x) => (
              <li key={x} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 6 — Smart Study Path                                               */
/* -------------------------------------------------------------------------- */

function StudyPathSection() {
  const steps = [
    {
      icon: Target,
      title: "Diagnose",
      body: "5-minute placement quiz maps current strengths and weak micro-concepts.",
    },
    {
      icon: Brain,
      title: "Plan",
      body: "AI builds a 30-day adaptive study path aligned to your exam goal.",
    },
    {
      icon: BookOpen,
      title: "Learn",
      body: "Bite-sized lessons, AI tutor support, instant doubt clearing.",
    },
    {
      icon: Zap,
      title: "Revise",
      body: "Smart flashcards and micro-tests on a spaced repetition schedule.",
    },
    {
      icon: Trophy,
      title: "Master",
      body: "Predicted scores climb. Confidence climbs faster.",
    },
  ];
  return (
    <section className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Smart Study Path"
          title="Your roadmap from confusion to confidence."
          description="A guided 5-stage journey that turns scattered studying into a clear, science-backed path."
        />
        <div className="relative mt-16">
          {/* connecting line */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-border bg-background p-6 text-center hover-lift"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-accent ring-4 ring-card">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium uppercase tracking-widest text-accent">
                  Step {i + 1}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 7 — Student Results                                                */
/* -------------------------------------------------------------------------- */

function ResultsSection() {
  const results = [
    { name: "Aarav Mehta", grade: "Class 10 · CBSE", before: 62, after: 89, subject: "Mathematics" },
    { name: "Diya Sharma", grade: "Class 9 · CBSE", before: 71, after: 94, subject: "Science" },
    { name: "Kabir Singh", grade: "Class 12 · CBSE", before: 58, after: 86, subject: "Physics" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="Student Results"
        title="Real scores. Real students. Real change."
        description="Average score lift of +24% within 90 days of consistent practice on Smart Lab."
      />
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {results.map((r) => (
          <div
            key={r.name}
            className="group rounded-2xl border border-border bg-card p-6 hover-lift"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary-glow font-display text-base font-semibold text-cream">
                {r.name[0]}
              </div>
              <div>
                <div className="font-display text-base font-semibold text-foreground">
                  {r.name}
                </div>
                <div className="text-xs text-muted-foreground">{r.grade}</div>
              </div>
            </div>
            <div className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
              {r.subject}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Before</div>
                <div className="font-display text-2xl font-semibold text-muted-foreground/70 line-through">
                  {r.before}%
                </div>
              </div>
              <ArrowRight className="mb-2 h-5 w-5 text-accent" />
              <div className="text-right">
                <div className="text-xs text-accent">After</div>
                <div className="font-display text-3xl font-semibold text-foreground">
                  {r.after}%
                </div>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary-glow transition-all duration-1000 group-hover:from-primary-glow group-hover:to-accent"
                style={{ width: `${r.after}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 8 — Parent Benefits                                                */
/* -------------------------------------------------------------------------- */

function ParentSection() {
  const items = [
    { icon: LineChart, title: "Weekly insight reports", body: "Email digest of progress, gaps, and next focus areas." },
    { icon: Clock, title: "Real-time study time", body: "See exactly how much focused study happened each day." },
    { icon: Heart, title: "Wellbeing signals", body: "Mood, stress and burnout alerts — never just marks." },
    { icon: MessageSquare, title: "Direct teacher channel", body: "Reach mentors with one tap, get responses within hours." },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow py-24 text-cream lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.76_0.13_85_/_0.25),transparent_50%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-3 py-1 text-xs font-medium text-cream">
            <Users className="h-3.5 w-3.5" /> For Parents
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Finally, clarity{" "}
            <span className="bg-gradient-to-r from-accent to-[oklch(0.85_0.14_85)] bg-clip-text text-transparent">
              instead of guesswork.
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-cream/75">
            A calm, beautiful parent dashboard that replaces report-card anxiety with
            weekly clarity and the right intervention at the right time.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-cream/10 bg-cream/[0.06] p-6 backdrop-blur-sm hover-lift"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 9 — School Integration                                             */
/* -------------------------------------------------------------------------- */

function SchoolSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <School className="h-3.5 w-3.5" /> For Schools
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Plug Smart Lab into your school in <span className="text-accent">a single weekend.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Bulk onboarding, NEP-aligned reporting, teacher dashboards, and assessment
            tools — built specifically for Indian schools and tuition centers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Bulk roster onboarding",
              "Teacher analytics console",
              "NEP-aligned reports",
              "SSO & secure data hosting",
              "Custom branding option",
              "Dedicated success manager",
            ].map((x) => (
              <div key={x} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent" />
                {x}
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              to="/schools"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              School partnership details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { icon: GraduationCap, title: "120+ partner schools", body: "Across 14 states in India." },
            { icon: Users, title: "Teacher control panel", body: "Assign, monitor, and intervene — at scale." },
            { icon: ShieldCheck, title: "Enterprise-grade security", body: "ISO-aligned, DPDP-ready, role-based access." },
          ].map((c) => (
            <div
              key={c.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 hover-lift"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-accent">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 10 — Testimonials                                                  */
/* -------------------------------------------------------------------------- */

function TestimonialsSection() {
  const testimonials = [
    {
      q: "My daughter went from dreading math to asking for extra Smart Lab time at night. The AI tutor genuinely explains until she gets it.",
      who: "Priya R., Parent · Bangalore",
    },
    {
      q: "The personalized study path helped me jump from 72% to 91% in pre-boards. The revision reminders alone are worth it.",
      who: "Arjun K., Class 10 · Delhi",
    },
    {
      q: "We rolled out Smart Lab to 600 students. Teacher workload dropped, and parents finally have clear weekly visibility.",
      who: "Dr. Meera S., Principal · Pune",
    },
  ];
  return (
    <section className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by students. Trusted by parents. Endorsed by schools."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.who}
              className="flex h-full flex-col justify-between rounded-2xl border border-border bg-background p-7 hover-lift"
            >
              <div>
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-base leading-relaxed text-foreground">
                  "{t.q}"
                </blockquote>
              </div>
              <figcaption className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
                — {t.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 11 — Pricing Preview                                               */
/* -------------------------------------------------------------------------- */

function PricingSection() {
  const tiers = [
    { name: "Starter", price: "₹499", tag: "Core daily plan", features: ["Daily AI study plan", "Concept library", "Basic progress tracking"], highlight: false },
    { name: "Smart Plus", price: "₹999", tag: "Most popular", features: ["Everything in Starter", "AI tutor unlimited", "Smart revision engine", "Parent dashboard"], highlight: true },
    { name: "Premium Pro", price: "₹1,999", tag: "Board prep ready", features: ["Everything in Smart Plus", "1:1 mentor sessions", "Mock test analytics", "Priority support"], highlight: false },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans. Premium outcomes."
        description="Start free, upgrade anytime. Annual billing saves 20%. School pricing on request."
      />
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-7 hover-lift ${
              t.highlight
                ? "border-accent/50 bg-gradient-to-br from-card to-accent/[0.05] shadow-elegant"
                : "border-border bg-card"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink">
                Most popular
              </div>
            )}
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {t.tag}
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
              {t.name}
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold text-foreground">
                {t.price}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                t.highlight
                  ? "bg-accent text-ink hover:bg-accent/90"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              Choose {t.name} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 12 — FAQ                                                           */
/* -------------------------------------------------------------------------- */

function FaqSection() {
  const faqs = [
    {
      q: "Which classes and boards does Smart Lab Online support?",
      a: "Smart Lab is built for CBSE Classes 6–12 today, with strongest fit for Grades 8–10. ICSE and state board support is on the 2026 roadmap.",
    },
    {
      q: "Is the AI tutor safe and accurate for school students?",
      a: "Yes. The AI is constrained to CBSE syllabus, fact-checked against verified sources, and has age-appropriate guardrails. Parents can audit every conversation.",
    },
    {
      q: "Do parents really get useful insights or just dashboards?",
      a: "Weekly digests, real-time study time, mood signals, and a one-tap teacher channel. Built for busy parents who don't want to log in daily.",
    },
    {
      q: "Can my school onboard hundreds of students at once?",
      a: "Absolutely. Bulk roster onboarding, SSO, teacher consoles, and dedicated success managers are built in. Most schools go live within a week.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes — 14 days of full Smart Plus access, no card required. Cancel anytime.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions, answered."
        description="If you don't see your question here, our team replies within a few hours."
      />
      <Accordion type="single" collapsible className="mt-12 w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left font-display text-base font-semibold text-foreground hover:text-accent">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 13 — Final CTA                                                     */
/* -------------------------------------------------------------------------- */

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center text-cream lg:p-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.76_0.13_85_/_0.28),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.85_0.14_85)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.14_85)_1px,transparent_1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-2xl">
          <Sparkles className="mx-auto mb-6 h-8 w-8 text-accent" />
          <h2 className="text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Give your child an AI study partner — starting tonight.
          </h2>
          <p className="mt-4 text-cream/70">
            14-day free trial · No credit card · Cancel anytime
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton>
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </CtaButton>
            <CtaButton variant="secondary" className="text-cream">
              Book a School Demo
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

function Home() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <AIFeaturesSection />
      <PersonalizedSection />
      <ProgressSection />
      <StudyPathSection />
      <ResultsSection />
      <ParentSection />
      <SchoolSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
