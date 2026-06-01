import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Rocket,
  ShieldCheck,
  Brain,
  Trophy,
  BookOpen,
  Zap,
  Users,
  GraduationCap,
  Flame,
  PartyPopper,
  Star,
} from "lucide-react";
import { Countdown } from "@/components/launch/Countdown";

// 7 June 2026, 6:00 PM IST (UTC+5:30) → 12:30 UTC
const LAUNCH_AT = "2026-06-07T12:30:00.000Z";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Lab Online — Launching 7 June 2026, 6:00 PM IST" },
      {
        name: "description",
        content:
          "Smart Lab Online launches 7 June 2026 at 6:00 PM IST. AI-powered learning for CBSE Classes 6–12. Registrations open at launch.",
      },
      { property: "og:title", content: "Smart Lab Online — Launching 7 June 2026" },
      {
        property: "og:description",
        content:
          "The AI learning OS for CBSE Classes 6–12. Registrations open 7 June 2026, 6:00 PM IST.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LaunchLanding,
});

/* Floating celebration particles */
function FloatingParticles() {
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const size = 4 + Math.random() * 12;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 6 + Math.random() * 8;
    const colors = [
      "oklch(0.78 0.2 85)",   // gold
      "oklch(0.7 0.22 30)",   // coral
      "oklch(0.72 0.18 330)", // magenta
      "oklch(0.74 0.14 210)", // cyan
      "oklch(0.66 0.16 155)", // green
    ];
    const color = colors[i % colors.length];
    return (
      <div
        key={i}
        aria-hidden
        className="pointer-events-none absolute rounded-full opacity-40"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          bottom: "-20px",
          backgroundColor: color,
          animation: `float-up ${duration}s linear ${delay}s infinite`,
        }}
      />
    );
  });
  return <>{particles}</>;
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI Tutor 24/7",
    desc: "Ask any doubt — get worked-out solutions, diagrams, and follow-up practice tuned to the CBSE syllabus.",
    color: "from-violet-500/20 to-fuchsia-500/20",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: Trophy,
    title: "Adaptive Tests",
    desc: "Smart mock tests with chapter-level insights and weak-area detection after every attempt.",
    color: "from-amber-500/20 to-orange-500/20",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: BookOpen,
    title: "Complete Course Material",
    desc: "Full syllabus coverage with notes, quizzes, practice problems, and revision sheets for every chapter.",
    color: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: Zap,
    title: "Personalized Study Paths",
    desc: "AI-curated daily plans that adapt to your pace, strengths, and upcoming exams.",
    color: "from-sky-500/20 to-cyan-500/20",
    iconBg: "bg-sky-500/15 text-sky-400",
  },
  {
    icon: Users,
    title: "Parent Dashboard",
    desc: "Weekly progress reports, performance alerts, and full visibility into every hour of study.",
    color: "from-rose-500/20 to-pink-500/20",
    iconBg: "bg-rose-500/15 text-rose-400",
  },
  {
    icon: GraduationCap,
    title: "School Connect",
    desc: "Class-level dashboards, teacher tools, and bulk onboarding for entire schools.",
    color: "from-indigo-500/20 to-blue-500/20",
    iconBg: "bg-indigo-500/15 text-indigo-400",
  },
];

function LaunchLanding() {
  return (
    <div className="relative overflow-x-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-hero text-cream">
        {/* Celebratory confetti grid backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.85_0.18_85)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.18_85)_1px,transparent_1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 25%, transparent 80%)",
          }}
        />

        {/* Animated glow orbs — celebratory colors */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-12 h-80 w-80 rounded-full bg-[oklch(0.78_0.2_85)]/25 blur-[80px] animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-24 h-72 w-72 rounded-full bg-[oklch(0.74_0.14_210)]/25 blur-[80px] animate-pulse"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/3 h-64 w-64 rounded-full bg-[oklch(0.72_0.18_330)]/20 blur-[70px] animate-pulse"
          style={{ animationDelay: "1.6s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 h-80 w-80 rounded-full bg-[oklch(0.7_0.22_30)]/20 blur-[80px] animate-pulse"
          style={{ animationDelay: "2.4s" }}
        />

        <FloatingParticles />

        <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center lg:py-28">
          {/* Launch badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.2_85)]/40 bg-[oklch(0.78_0.2_85)]/10 px-5 py-2 text-sm font-medium tracking-wide text-[oklch(0.85_0.18_85)] animate-fade-in"
          >
            <PartyPopper className="h-4 w-4" />
            Official launch — 7 June 2026
            <Sparkles className="h-4 w-4" />
          </div>

          {/* Main headline */}
          <h1
            className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            India's AI learning revolution{" "}
            <span className="bg-gradient-to-r from-[oklch(0.85_0.18_85)] via-[oklch(0.74_0.14_210)] to-[oklch(0.72_0.18_330)] bg-clip-text text-transparent">
              launches soon!
            </span>
          </h1>

          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/80 sm:text-xl animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            Smart Lab Online — the AI-first study platform for{" "}
            <strong className="text-cream">CBSE Classes 6–12</strong> — goes live on{" "}
            <strong className="text-cream">7 June 2026 at 6:00 PM IST</strong>.
            Be ready to experience the future of learning.
          </p>

          {/* Countdown */}
          <div
            className="mt-12 w-full max-w-2xl animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Countdown target={LAUNCH_AT} />
          </div>

          {/* CTA buttons */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.78_0.2_85)] to-[oklch(0.7_0.18_40)] px-8 py-4 text-base font-semibold tracking-tight text-[#1a1200] shadow-[0_0_30px_-6px_oklch(0.78_0.2_85/0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-4px_oklch(0.78_0.2_85/0.7)]"
            >
              <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Access portal for testing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/25 bg-cream/10 px-8 py-4 text-base font-medium text-cream backdrop-blur-sm transition-all duration-300 hover:bg-cream/15 hover:-translate-y-0.5"
            >
              <Flame className="h-4 w-4 text-[oklch(0.78_0.2_85)]" />
              Tester sign in
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-cream/50">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[oklch(0.74_0.14_210)]" /> CBSE-aligned
            </span>
            <span className="h-1 w-1 rounded-full bg-[oklch(0.78_0.2_85)]/60" />
            <span>Classes 6–12</span>
            <span className="h-1 w-1 rounded-full bg-[oklch(0.78_0.2_85)]/60" />
            <span>By Gosel Global Holdings</span>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <Star className="h-3.5 w-3.5" />
            What&apos;s Inside
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="text-gradient">ace your exams</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A complete learning ecosystem built for CBSE students, parents, and schools — powered by AI.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 elev-1 transition-soft hover:-translate-y-1 hover:elev-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Subtle gradient wash */}
              <div
                aria-hidden
                className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative">
                <div
                  className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${f.iconBg}`}
                >
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="border-y bg-gradient-to-r from-primary/[0.03] via-accent/[0.05] to-primary/[0.03]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6 py-10 sm:gap-16">
          {[
            { value: "12,400+", label: "Students on waitlist" },
            { value: "38", label: "Schools in pilot" },
            { value: "5", label: "CBSE subjects live" },
            { value: "4.9/5", label: "Early access rating" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-amber-500">
            <Sparkles className="h-3.5 w-3.5" />
            Early love
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            What early users are saying
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {[
            {
              quote:
                "My daughter actually asks for her study time now. The AI tutor explains concepts the way her teacher does.",
              name: "Priya M.",
              role: "Parent · Class 9, Delhi",
            },
            {
              quote:
                "Smart Lab caught the exact chapters I was weak in before my pre-boards. Topper-style revision in 20 minutes a day.",
              name: "Aarav S.",
              role: "Student · Class 10, Bengaluru",
            },
            {
              quote:
                "We rolled it out to 600 students. Teacher dashboards saved our department 8+ hours a week on doubt-solving.",
              name: "Mr. R. Iyer",
              role: "Academic Head · CBSE School, Pune",
            },
          ].map((q) => (
            <figure
              key={q.name}
              className="rounded-2xl border bg-card p-6 elev-1 transition-soft hover:-translate-y-1"
            >
              <div className="mb-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{q.name}</span> · {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center lg:py-28">
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Be there on day one.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Lock in launch pricing, founder badges, and bonus AI credits when you join the waitlist.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.78_0.2_85)] to-[oklch(0.7_0.18_40)] px-8 py-3.5 text-base font-semibold text-[#1a1200] shadow-[0_0_24px_-6px_oklch(0.78_0.2_85/0.45)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <Rocket className="h-4 w-4" />
              Get early access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-base font-medium transition-colors hover:bg-muted"
            >
              <Flame className="h-4 w-4" />
              Tester sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ===== KEYFRAMES ===== */}
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
