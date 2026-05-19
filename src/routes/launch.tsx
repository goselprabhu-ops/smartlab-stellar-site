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
      { title: "Smart Lab Online — Launching Soon · Join the Early Access Waitlist" },
      {
        name: "description",
        content:
          "Be first in line for India's most personalized AI learning platform for CBSE Classes 6–12. Join the waitlist, refer friends, and unlock launch-day rewards.",
      },
      { property: "og:title", content: "Smart Lab Online — Launching Soon" },
      {
        property: "og:description",
        content:
          "Early access is opening in waves. Join 12,000+ learners on the waitlist and skip the queue with referrals.",
      },
    ],
    links: [{ rel: "canonical", href: "/launch" }],
  }),
  component: LaunchPage,
});

function LaunchPage() {
  const { config } = Route.useLoaderData();
  const { ref } = Route.useSearch();
  const track = useServerFn(trackReferralClick);

  useEffect(() => {
    if (ref) track({ data: { code: ref } }).catch(() => null);
  }, [ref, track]);

  const [joined, setJoined] = useState<{ referralCode: string; totalSignups: number } | null>(null);

  return (
    <div className="space-y-24 pb-24">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-16 sm:pt-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Version 1 · Launching soon
              </div>

              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                The AI study partner built for{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  CBSE Classes 6–12
                </span>
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground">
                Personalized study paths, smart revision, and an AI tutor that explains the way your favourite teacher does — all backed by real progress visibility for parents and schools.
              </p>

              <Countdown target={config.launch_at} />

              <div className="flex flex-wrap items-center gap-3">
                <a href="#waitlist">
                  <Button size="lg" className="rounded-full">
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

      {/* Why join */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Brain,
              title: "AI tutor, 24/7",
              body: "Ask anything — get worked-out solutions, diagrams, and follow-up practice tuned to your syllabus.",
            },
            {
              icon: Trophy,
              title: "Smart Lab Online tests",
              body: "Adaptive mock tests with chapter-level insights and weak-area detection after every attempt.",
            },
            {
              icon: ShieldCheck,
              title: "Parent + school visibility",
              body: "Weekly progress reports, performance alerts, and dashboards that make every hour of study count.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 elev-1">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-6xl px-6">
        <SocialProof />
      </section>

      {/* Referral CTA */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 elev-2 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
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
      <section className="mx-auto max-w-6xl px-6">
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
      <section className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight">
          Be there on day one.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Early access opens in waves. Join now to lock in launch pricing, founder badges, and bonus AI credits.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="#waitlist">
            <Button size="lg" className="rounded-full">
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
    </div>
  );
}
