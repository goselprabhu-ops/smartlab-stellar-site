import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Rocket, ShieldCheck } from "lucide-react";
import { Countdown } from "@/components/launch/Countdown";

// 1 June 2026, 6:00 PM IST (UTC+5:30) → 12:30 UTC
const LAUNCH_AT = "2026-06-01T12:30:00.000Z";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Lab Online — Launching 1 June 2026, 6:00 PM IST" },
      {
        name: "description",
        content:
          "Smart Lab Online launches 1 June 2026 at 6:00 PM IST. AI-powered learning for CBSE Classes 6–12. Registrations open at launch.",
      },
      { property: "og:title", content: "Smart Lab Online — Launching 1 June 2026" },
      {
        property: "og:description",
        content:
          "The AI learning OS for CBSE Classes 6–12. Registrations open 1 June 2026, 6:00 PM IST.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LaunchLanding,
});

function LaunchLanding() {
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
        className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-primary-glow/30 blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center lg:py-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium tracking-wide text-accent animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          Official launch — 1 June 2026
        </div>

        <h1
          className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          Something big is{" "}
          <span className="bg-gradient-to-r from-accent via-[oklch(0.85_0.14_85)] to-accent bg-clip-text text-transparent">
            launching soon.
          </span>
        </h1>

        <p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/75 sm:text-xl animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          Smart Lab Online — India's AI-first learning OS for CBSE Classes 6–12 —
          goes live on <strong className="text-cream">1 June 2026 at 6:00 PM IST</strong>.
          Registrations open the moment the clock hits zero.
        </p>

        <div
          className="mt-12 w-full max-w-2xl animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <Countdown target={LAUNCH_AT} />
        </div>

        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold px-7 py-3.5 text-base font-medium tracking-tight text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <Rocket className="h-4 w-4" /> Access portal for testing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/20 bg-transparent px-7 py-3.5 text-base font-medium text-cream transition-colors hover:bg-cream/10"
          >
            Tester sign in
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-cream/50">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> CBSE-aligned
          </span>
          <span className="h-1 w-1 rounded-full bg-accent/60" />
          <span>Built for Classes 6–12</span>
          <span className="h-1 w-1 rounded-full bg-accent/60" />
          <span>By Gosel Global Holdings</span>
        </div>
      </div>
    </section>
  );
}
