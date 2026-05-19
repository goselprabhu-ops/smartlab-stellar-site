import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, X, Sparkles, type LucideIcon } from "lucide-react";
import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

/**
 * Smart Lab Online — Marketing feature page shell.
 * Standardized layout for /product/* pages:
 * hero → sticky sub-nav → explanation → interactive preview → benefits
 * → outcomes → comparison → final CTA.
 */

export interface MFPBenefit { icon: LucideIcon; title: string; description: string }
export interface MFPOutcome { stat: string; label: string; sub?: string }
export interface MFPSection { id: string; label: string }
export interface MFPCompareRow { label: string; us: string | true; them: string | false }

export interface MarketingFeaturePageProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  heroVisual: ReactNode;
  explanation: { title: string; body: string; bullets: string[] };
  preview: { title: string; description: string; node: ReactNode };
  benefits: MFPBenefit[];
  outcomes: MFPOutcome[];
  comparison?: { theirsLabel?: string; rows: MFPCompareRow[] };
  finalCta?: { title: string; description: string; to: string; label: string };
}

const SECTIONS: MFPSection[] = [
  { id: "overview",   label: "Overview" },
  { id: "preview",    label: "Preview" },
  { id: "benefits",   label: "Benefits" },
  { id: "outcomes",   label: "Outcomes" },
  { id: "compare",    label: "Compare" },
];

export function MarketingFeaturePage(props: MarketingFeaturePageProps) {
  const {
    eyebrow, title, description, primaryCta, secondaryCta,
    heroVisual, explanation, preview, benefits, outcomes, comparison, finalCta,
  } = props;

  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pb-24 pt-20 text-white lg:pt-28">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">{description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryCta && (
                <Link to={primaryCta.to}>
                  <CtaButton size="md" external={false} href={primaryCta.to}>
                    {primaryCta.label}
                  </CtaButton>
                </Link>
              )}
              {secondaryCta && (
                <Link
                  to={secondaryCta.to}
                  className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
          <div className="animate-scale-in relative">
            <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-cyan-400/20 via-blue-400/10 to-transparent blur-2xl" />
            <div className="elev-5 rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-xl">
              {heroVisual}
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SUB-NAV */}
      <div className="sticky top-[65px] z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="container mx-auto max-w-7xl px-6">
          <nav className="flex gap-1 overflow-x-auto py-3">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  active === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* OVERVIEW / EXPLANATION */}
      <section id="overview" className="container mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="How it works"
            title={explanation.title}
            description={explanation.body}
            align="left"
          />
          <ul className="space-y-3">
            {explanation.bullets.map((b) => (
              <li key={b} className="hover-lift flex items-start gap-3 rounded-xl border bg-card p-4 elev-1">
                <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md">
                  <Check className="size-3.5" />
                </span>
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="bg-muted/40 py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Interactive preview"
            title={preview.title}
            description={preview.description}
          />
          <div className="mt-12">
            <div className="elev-4 rounded-2xl border bg-card p-4 md:p-6">
              {preview.node}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="container mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Why it matters"
          title="Designed around the way students actually learn"
          description="Each capability ladders up to a measurable benefit — for students, parents, and schools."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="hover-lift rounded-2xl border bg-card p-6 elev-2">
              <div className="bg-gradient-brand mb-4 inline-flex size-10 items-center justify-center rounded-xl text-white">
                <b.icon className="size-5" />
              </div>
              <h3 className="font-display text-base font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OUTCOMES */}
      <section id="outcomes" className="bg-muted/40 py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Student outcomes"
            title="Real results, measured weekly"
            description="Aggregate numbers from Smart Lab Online pilot cohorts (Classes 6–12, CBSE)."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((o) => (
              <div
                key={o.label}
                className="rounded-2xl border bg-card p-6 elev-2 transition-soft hover:shadow-elegant"
              >
                <div className="font-display text-4xl font-semibold tracking-tight text-primary">
                  {o.stat}
                </div>
                <div className="mt-2 text-sm font-medium">{o.label}</div>
                {o.sub && <div className="mt-1 text-xs text-muted-foreground">{o.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      {comparison && (
        <section id="compare" className="container mx-auto max-w-5xl px-6 py-24">
          <SectionHeading
            eyebrow="Compare"
            title="Smart Lab Online vs traditional tools"
            description="A side-by-side look at how we approach the same problems."
          />
          <div className="mt-12 overflow-hidden rounded-2xl border bg-card elev-2">
            <div className="grid grid-cols-3 gap-0 border-b bg-muted/40 px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div>Capability</div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Sparkles className="size-3.5" /> Smart Lab Online
                </span>
              </div>
              <div className="text-center">{comparison.theirsLabel ?? "Traditional tools"}</div>
            </div>
            {comparison.rows.map((r, i) => (
              <div
                key={r.label}
                className={cn(
                  "grid grid-cols-3 items-center gap-0 px-6 py-4 text-sm",
                  i % 2 === 1 && "bg-muted/20",
                )}
              >
                <div className="font-medium">{r.label}</div>
                <div className="flex items-center justify-center gap-2 text-center">
                  {r.us === true ? (
                    <Check className="text-success size-4" />
                  ) : (
                    <span className="text-foreground">{r.us}</span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-center text-muted-foreground">
                  {r.them === false ? (
                    <X className="text-destructive/70 size-4" />
                  ) : (
                    <span>{r.them}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="container mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-white elev-5 md:p-14">
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {finalCta?.title ?? "Ready to see it for your student?"}
              </h2>
              <p className="mt-3 text-white/75">
                {finalCta?.description ??
                  "Book a 20-minute demo. We'll walk you through Smart Lab Online live, with your class and syllabus."}
              </p>
            </div>
            <Link to={finalCta?.to ?? "/demo"}>
              <CtaButton size="lg" external={false} href={finalCta?.to ?? "/demo"}>
                {finalCta?.label ?? "Book a demo"}
                <ArrowRight className="size-4" />
              </CtaButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
