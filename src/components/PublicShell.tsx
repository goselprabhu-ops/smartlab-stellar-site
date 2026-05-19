import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { CtaButton } from "./CtaButton";

/**
 * Smart Lab Online — Public marketing page shell.
 * Hero + sectioned feature grid with consistent visual treatment.
 */

export interface PublicFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PublicShellProps {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  features: PublicFeature[];
  children?: React.ReactNode;
}

export function PublicShell({
  eyebrow, title, description, primaryCta, secondaryCta, features, children,
}: PublicShellProps) {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero pb-24 pt-20 text-white lg:pt-28">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="container relative mx-auto max-w-5xl px-6 text-center">
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/75">{description}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {primaryCta && (
                <Link to={primaryCta.to}>
                  <CtaButton size="md">
                    {primaryCta.label} <ArrowRight className="ml-1 size-4" />
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
          )}
        </div>
      </section>

      {children}

      {features.length > 0 && (
        <section className="container mx-auto max-w-6xl px-6 py-20">
          <SectionHeading
            eyebrow="What's inside"
            title="Built for measurable outcomes"
            description="Every section of Smart Lab Online is engineered around one question: did the student actually learn it?"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="hover-lift rounded-2xl border bg-card p-6 elev-2">
                <div className="bg-gradient-brand mb-4 inline-flex size-10 items-center justify-center rounded-xl text-white">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
