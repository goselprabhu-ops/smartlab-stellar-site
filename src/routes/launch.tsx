import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Rocket,
  Brain,
  Trophy,
  ShieldCheck,
  Gift,
  Calendar,
  MessageCircle,
  ArrowRight,
  PlayCircle,
  PartyPopper,
  Flame,
  Star,
  BookOpen,
  Zap,
  Users,
  GraduationCap,
} from "lucide-react";
import { z } from "zod";

import { getLaunchConfig, trackReferralClick } from "@/lib/launch.functions";
import { Countdown } from "@/components/launch/Countdown";
import { WaitlistForm } from "@/components/launch/WaitlistForm";
import { SocialProof } from "@/components/launch/SocialProof";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";

const search = z.object({ ref: z.string().trim().max(40).optional() });

export const Route = createFileRoute("/launch")({
  validateSearch: (s) => search.parse(s),
  loaderDeps: ({ search: s }) => ({ ref: s.ref }),
  loader: async () => ({ config: await getLaunchConfig() }),
  head: () => ({
    meta: [
      { title: "Smart Lab Online — Launching 7 June 2026 · Join the Early Access Waitlist" },
      {
        name: "description",
        content:
          "Be first in line for India's most personalized AI learning platform for CBSE Classes 6–12. Join the waitlist, refer friends, and unlock launch-day rewards.",
      },
      { property: "og:title", content: "Smart Lab Online — Launching 7 June 2026" },
      {
        property: "og:description",
        content:
          "Early access opens 7 June 2026. Join 12,000+ learners on the waitlist and skip the queue with referrals.",
      },
    ],
    links: [{ rel: "canonical", href: "/launch" }],
  }),
  component: LaunchPage,
});

/* Floating celebration particles */
function FloatingParticles() {
  const particles = Array.from({ length: 16 }).map((_, i) => {
    const size = 4 + Math.random() * 10;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 7 + Math.random() * 9;
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
        className="pointer-events-none absolute rounded-full opacity-30"
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
    body: "Ask anything — get worked-out solutions, diagrams, and follow-up practice tuned to your syllabus.",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: Trophy,
    title: "Adaptive Tests",
    body: "Smart mock tests with chapter-level insights and weak-area detection after every attempt.",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: BookOpen,
    title: "Complete Course Material",
    body: "Full syllabus coverage with notes, quizzes, practice problems, and revision sheets.",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: Zap,
    title: "Personalized Study Paths",
    body: "AI-curated daily plans that adapt to your pace, strengths, and upcoming exams.",
    iconBg: "bg-sky-500/15 text-sky-400",
  },
  {
    icon: Users,
    title: "Parent Dashboard",
    body: "Weekly progress reports, performance alerts, and full visibility into every hour of study.",
    iconBg: "bg-rose-500/15 text-rose-400",
  },
  {
    icon: GraduationCap,
    title: "School Connect",
    body: "Class-level dashboards, teacher tools, and bulk onboarding for entire schools.",
    iconBg: "bg-indigo-500/15 text-indigo-400",
  },
];

function LaunchPage() {
  const { config } = Route.useLoaderData();
  const { ref } = Route.useSearch();
  const track = useServerFn(trackReferralClick);

  useEffect(() => {
    if (ref) track({ data: { code: ref } }).catch(() => null);
  }, [ref, track]);

  const [joined, setJoined] = useState<{ referralCode: string; totalSignups: number } | null>(null);

  return (
    <div className="relative overflow-x-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <FloatingParticles />

        {/* Celebratory glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-8 h-80 w-80 rounded-full bg-[oklch(0.78_0.2_85)]/20 blur-[90px] animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-20 h-72 w-72 rounded-full bg-[oklch(0.74_0.14_210)]/20 blur-[80px] animate-pulse"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-16 left-1/4 h-64 w-64 rounded-full bg-[oklch(0.72_0.18_330)]/15 blur-[70px] animate-pulse"
          style={{ animationDelay: "1.6s" }}
        />

        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]" />

        <div className="mx-auto max-w-6xl px-6 pt-16 sm:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.2_85)]/30 bg-[oklch(0.78_0.2_85)]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[oklch(0.85_0.18_85)]">
                <PartyPopper className="size-3.5" />
                Version 1 · Launching 7 June 2026
              </div>

              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                The AI study partner built for{" "}
                <span className="bg-gradient-to-r from-primary via-[oklch(0.74_0.14_210)] to-[oklch(0.72_0.18_330)] bg-clip-text text-transparent">
                  CBSE Classes 6–12
                </span>
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground">
                Personalized study paths, smart revision, and an AI tutor that explains the way your favourite teacher does — all backed by real progress visibility for parents and schools.
              </p>

              <Countdown target={config.launch_at} />

              <div className="flex flex-wrap items-center gap-3">
                <a href="#waitlist">
                  <Button size="lg" className="rounded-full bg-gradient-to-r from-[oklch(0.78_0.2_85)] to-[oklch(0.7_0.18_40)] text-[#1a1200] hover:opacity-95">
                    <Rocket className="mr-2 size-4" /> Join the waitlist
                  </Button>
                </a>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Calendar className="mr-2 size-4" /> Book a live demo
                  </Button>
                </Link>
                <WhatsAppButton label="Talk on WhatsApp" />
              </div>

              {config.demo_mode_enabled ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <PlayCircle className="size-4" /> Try the live demo mode — no signup
                </Link>
              ) : null}
            </div>

            {/* Waitlist card */}
            <div id="waitlist" className="lg:sticky lg:top-24">
              <WaitlistForm referredByCode={ref} onJoined={setJoined} />
              {joined ? (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your spot is locked in. Share your link to skip ahead.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Why join — Features */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <Star className="size-3.5" />
            What&apos;s Inside
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="text-gradient">ace your exams</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 elev-1 transition-soft hover:-translate-y-1 hover:elev-3"
            >
              <div className="relative">
                <div className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${f.iconBg}`}>
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <SocialProof />
      </section>

      {/* Referral CTA */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div className="rounded-3xl border bg-gradient-to-br from-[oklch(0.78_0.2_85)]/10 via-card to-card p-8 elev-2 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.78_0.2_85)]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[oklch(0.78_0.16_85)]">
                <Gift className="size-3.5" /> Referral rewards
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Bring 3 friends, get {config.referral_reward ?? "1 month free Pro"}
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Every signup using your link bumps you up the waitlist. Top referrers get lifetime perks and a personal onboarding call.
              </p>
            </div>
            <Link to="/referral">
              <Button size="lg" className="rounded-full">
                See referral program <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Lead funnels: 3 personas */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "For Students",
              body: "Personal study path + AI doubt-solving + adaptive tests.",
              href: "/signup?role=student",
              cta: "Start as a student",
            },
            {
              title: "For Parents",
              body: "Weekly reports, performance alerts, and full progress visibility.",
              href: "/signup?role=parent",
              cta: "Create parent account",
            },
            {
              title: "For Schools",
              body: "Class-level dashboards, teacher tools, and bulk onboarding.",
              href: "/schools",
              cta: "Talk to our schools team",
            },
          ].map((f) => (
            <Link
              key={f.title}
              to={f.href}
              className="group rounded-2xl border bg-card p-6 elev-1 transition-soft hover:-translate-y-0.5 hover:elev-2"
            >
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                {f.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-24 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight">
          Be there on day one.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Early access opens in waves. Join now to lock in launch pricing, founder badges, and bonus AI credits.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="#waitlist">
            <Button size="lg" className="rounded-full bg-gradient-to-r from-[oklch(0.78_0.2_85)] to-[oklch(0.7_0.18_40)] text-[#1a1200] hover:opacity-95">
              <Rocket className="mr-2 size-4" /> Join the waitlist
            </Button>
          </a>
          <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="rounded-full">
              <MessageCircle className="mr-2 size-4" /> Chat with us
            </Button>
          </a>
        </div>
      </section>

      <WhatsAppButton floating />

      {/* Keyframes for floating particles */}
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
