import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { CtaButton } from "@/components/CtaButton";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — SmartLab Online" },
      {
        name: "description",
        content:
          "Three plans for Classes 6–12: Starter ₹499/mo, Smart Plus ₹999/mo, Premium Pro ₹1999/mo. Save 20% annually. Bulk pricing for schools and tuitions.",
      },
      { property: "og:title", content: "Pricing — SmartLab Online" },
      {
        property: "og:description",
        content:
          "Simple monthly plans with 20% annual discount. School and tuition bulk pricing available.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "SmartLab Online",
          description:
            "AI-powered learning ecosystem for Classes 6–12 CBSE students.",
          offers: [
            { "@type": "Offer", name: "Starter", price: "499", priceCurrency: "INR" },
            { "@type": "Offer", name: "Smart Plus", price: "999", priceCurrency: "INR" },
            { "@type": "Offer", name: "Premium Pro", price: "1999", priceCurrency: "INR" },
          ],
        }),
      },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Starter",
    price: "499",
    tagline: "For students just starting out.",
    features: [
      "AI personalized daily plan",
      "Core CBSE syllabus coverage",
      "Basic concept diagnostics",
      "Weekly progress summary",
    ],
    highlight: false,
  },
  {
    name: "Smart Plus",
    price: "999",
    tagline: "Smart revision built for serious learners.",
    features: [
      "Everything in Starter",
      "Spaced revision engine",
      "Full concept-mastery tracking",
      "Parent visibility dashboard",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Premium Pro",
    price: "1999",
    tagline: "Full ecosystem for board-exam years.",
    features: [
      "Everything in Smart Plus",
      "1:1 mentor check-ins",
      "Mock test analysis suite",
      "Teacher / tuition dashboard",
      "Advanced exam-readiness reports",
    ],
    highlight: false,
  },
];

function PricingPage() {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple plans. Serious progress."
            description="Pick the plan that fits the student. Switch any time. Annual billing saves 20%."
            as="h1"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border bg-card p-8 transition-all duration-300 ${
                t.highlight
                  ? "border-accent shadow-gold lg:-translate-y-3"
                  : "border-border hover:border-accent/40"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground shadow-gold">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                </div>
              )}
              <h3 className="font-display text-xl font-semibold text-foreground">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-semibold tracking-tight text-foreground">
                  ₹{t.price}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="mt-7 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                        t.highlight ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-2">
                <CtaButton
                  variant={t.highlight ? "primary" : "secondary"}
                  size="md"
                  className="w-full justify-center"
                >
                  Experience Smart Lab
                </CtaButton>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-4 rounded-2xl border border-border bg-card p-7 sm:grid-cols-2 sm:p-9">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Save 20% with annual billing
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay once, plan the whole year. Switch tiers any time.
            </p>
          </div>
          <div className="sm:text-right">
            <h3 className="font-display text-base font-semibold text-foreground">
              Schools & tuitions
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bulk pricing available —{" "}
              <Link to="/contact" className="font-medium text-accent hover:underline">
                contact us
              </Link>{" "}
              for a custom quote.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
