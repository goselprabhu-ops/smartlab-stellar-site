import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Check, X, Sparkles, ShieldCheck, Award, Users, GraduationCap, Heart,
  BookOpen, Brain, LineChart, Lock, ArrowRight, Building2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SectionHeading } from "@/components/SectionHeading";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { submitContact } from "@/lib/contact.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Smart Lab Online" },
      { name: "description", content: "Four plans for Classes 6–12: Basic, Pro, Premium, and School. Monthly or yearly billing — save 20% annually. Bulk school pricing available." },
      { property: "og:title", content: "Pricing — Smart Lab Online" },
      { property: "og:description", content: "Simple, honest pricing. Switch any time. Save 20% with yearly billing." },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Smart Lab Online",
          description: "AI-powered learning platform for CBSE Classes 6–12.",
          offers: [
            { "@type": "Offer", name: "Basic",   price: "499",  priceCurrency: "INR" },
            { "@type": "Offer", name: "Pro",     price: "999",  priceCurrency: "INR" },
            { "@type": "Offer", name: "Premium", price: "1999", priceCurrency: "INR" },
            { "@type": "Offer", name: "School",  price: "0",    priceCurrency: "INR" },
          ],
        }),
      },
    ],
  }),
  component: PricingPage,
});

// ─────────────────────────── plans

type PlanId = "basic" | "pro" | "premium" | "school";

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;     // INR/month
  yearly: number;      // INR/month when billed yearly
  badge?: string;
  highlight?: boolean;
  ctaLabel: string;
  features: string[];
  audience: string;
  icon: typeof BookOpen;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Start the habit.",
    monthly: 499,
    yearly: 399,
    audience: "1 student · Classes 6–10",
    ctaLabel: "Start free for 7 days",
    icon: BookOpen,
    features: [
      "AI personalized daily plan",
      "Core CBSE syllabus (1 grade)",
      "Basic concept diagnostics",
      "Weekly progress summary",
      "Mobile + web access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Serious daily learning.",
    monthly: 999,
    yearly: 799,
    badge: "Most popular",
    highlight: true,
    audience: "1 student · Classes 6–12",
    ctaLabel: "Start free for 14 days",
    icon: Brain,
    features: [
      "Everything in Basic",
      "AI tutor (unlimited chats)",
      "Spaced revision engine",
      "Full concept-mastery tracking",
      "Parent visibility dashboard",
      "Adaptive chapter tests",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Built for board years.",
    monthly: 1999,
    yearly: 1599,
    badge: "Boards-ready",
    audience: "1 student · Classes 9–12",
    ctaLabel: "Talk to an advisor",
    icon: Award,
    features: [
      "Everything in Pro",
      "Full mock exam suite (CBSE blueprint)",
      "1:1 monthly mentor check-in",
      "AI-graded long answers",
      "Exam-readiness forecast",
      "Predicted score reports",
      "Dedicated success manager",
    ],
  },
  {
    id: "school",
    name: "School",
    tagline: "For institutions & tuitions.",
    monthly: 0,
    yearly: 0,
    badge: "Custom",
    audience: "50+ students · school-wide",
    ctaLabel: "Request a quote",
    icon: Building2,
    features: [
      "Everything in Premium",
      "Teacher & admin dashboards",
      "Cohort analytics & heatmaps",
      "Custom content uploads",
      "SSO and roster sync",
      "Onboarding & training included",
      "SLA-backed support",
    ],
  },
];

// ─────────────────────────── comparison matrix

type FeatureCell = boolean | string;
interface CompareRow { label: string; group: string; values: Record<PlanId, FeatureCell> }

const COMPARE: CompareRow[] = [
  { group: "Learning",   label: "AI personalized daily plan",      values: { basic: true,  pro: true,  premium: true,  school: true } },
  { group: "Learning",   label: "AI tutor (24/7 chat)",            values: { basic: "Limited", pro: true,  premium: true,  school: true } },
  { group: "Learning",   label: "Subjects covered",                values: { basic: "Core",   pro: "All",  premium: "All", school: "All + custom" } },
  { group: "Learning",   label: "Spaced revision engine",          values: { basic: false, pro: true,  premium: true,  school: true } },
  { group: "Practice",   label: "Adaptive chapter tests",          values: { basic: "Sample", pro: true,  premium: true,  school: true } },
  { group: "Practice",   label: "CBSE mock exam suite",            values: { basic: false, pro: "Limited", premium: true,  school: true } },
  { group: "Practice",   label: "AI-graded long answers",          values: { basic: false, pro: false, premium: true,  school: true } },
  { group: "Progress",   label: "Mastery scoring",                 values: { basic: "Basic", pro: true,  premium: true,  school: true } },
  { group: "Progress",   label: "Memory heatmaps",                 values: { basic: false, pro: true,  premium: true,  school: true } },
  { group: "Progress",   label: "Exam-readiness forecast",         values: { basic: false, pro: false, premium: true,  school: true } },
  { group: "People",     label: "Parent dashboard",                values: { basic: "Weekly", pro: true,  premium: true,  school: true } },
  { group: "People",     label: "1:1 mentor check-ins",            values: { basic: false, pro: false, premium: "Monthly", school: "On request" } },
  { group: "People",     label: "Teacher & admin dashboards",      values: { basic: false, pro: false, premium: false, school: true } },
  { group: "Support",    label: "Support",                         values: { basic: "Email", pro: "Priority", premium: "Dedicated SM", school: "SLA-backed" } },
  { group: "Support",    label: "Onboarding & training",           values: { basic: false, pro: false, premium: "Self-serve", school: true } },
];

// ─────────────────────────── FAQ

const FAQ = [
  { q: "Is there a free trial?", a: "Yes — Basic and Pro come with a 7- and 14-day free trial respectively. No card required to start." },
  { q: "Can I switch plans later?", a: "Anytime, in one click. Upgrades take effect immediately; downgrades apply from the next billing cycle." },
  { q: "How does yearly billing work?", a: "You pay once for 12 months at the discounted rate (~20% off). You can cancel mid-year and we'll refund the unused months on a pro-rata basis." },
  { q: "What's included for parents?", a: "Pro and above include the full parent dashboard — weekly summaries, mastery trends, and smart alerts. Privacy-first: students see exactly what parents see." },
  { q: "Do you support tuition centers?", a: "Yes. Our School plan is built for institutions and tuition chains, with teacher dashboards, cohort analytics, SSO, and roster sync." },
  { q: "Which classes and boards are covered?", a: "CBSE Classes 6–12 at launch. ICSE and state boards roll out through 2026 — talk to us if you need a specific board." },
  { q: "Is my data safe?", a: "All data is encrypted in transit and at rest. We follow India's DPDP Act guidelines and never sell student data." },
  { q: "How do I get help?", a: "Email support for Basic, priority chat for Pro, a dedicated success manager for Premium, and SLA-backed support for School." },
];

// ─────────────────────────── page

function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-20 text-white lg:pt-28">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container relative mx-auto max-w-5xl px-6 text-center">
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">Pricing</p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            One plan per student. <span className="text-accent">No surprises.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/75">
            Honest pricing for Classes 6–12. Start with a free trial. Switch any time. Save 20% with yearly billing.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <BillingToggle yearly={yearly} onChange={setYearly} />
          </div>

          <TrustStrip />
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="container mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => <PlanCard key={p.id} plan={p} yearly={yearly} />)}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in INR. GST extra where applicable. Cancel anytime.
        </p>
      </section>

      {/* OUTCOME COUNTERS */}
      <OutcomeStrip />

      {/* COMPARISON */}
      <section className="container mx-auto max-w-7xl px-6 py-20">
        <SectionHeading
          eyebrow="Compare plans"
          title="Everything you get, side by side"
          description="Pick the line items that matter most to your student — and see which plan covers them."
        />
        <div className="mt-12">
          <ComparisonTable yearly={yearly} />
        </div>
      </section>

      {/* PARENT CONFIDENCE */}
      <ParentConfidence />

      {/* LEAD CAPTURE */}
      <section id="lead" className="container mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Talk to an advisor"
              title="Not sure which plan fits?"
              description="Drop your details — a Smart Lab Online advisor will call you within one business day with a tailored recommendation."
              align="left"
            />
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "20-minute call, no slides — live product walkthrough.",
                "We'll match the plan to your child's grade and goals.",
                "Get a free 14-day full-access trial after the call.",
              ].map((l) => (
                <li key={l} className="flex items-start gap-3">
                  <Check className="text-success mt-0.5 size-4 shrink-0" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/demo">
                <Button>Book a live demo <ArrowRight className="size-4" /></Button>
              </Link>
              <WhatsAppButton message="Hi Smart Lab Online — I'd like help choosing a plan." />
            </div>
          </div>
          <LeadCaptureForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto max-w-3xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            description="Still stuck? Ping us on WhatsApp — we usually reply within minutes."
          />
          <Accordion type="single" collapsible className="mt-10 rounded-2xl border bg-card elev-2">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="border-b last:border-b-0">
                <AccordionTrigger className="px-5 text-left text-sm font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-sm text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* STICKY BOTTOM CTA */}
      <StickyPricingCta />

      {/* FLOATING WHATSAPP */}
      <WhatsAppButton floating className="bottom-24 sm:bottom-6" message="Hi Smart Lab Online — I'm on your pricing page and have a question." />
    </>
  );
}

// ─────────────────────────── billing toggle

function BillingToggle({ yearly, onChange }: { yearly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.06] p-1 backdrop-blur">
      <button
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          !yearly ? "bg-white text-[var(--ink,#0a1429)]" : "text-white/75 hover:text-white",
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          yearly ? "bg-white text-[var(--ink,#0a1429)]" : "text-white/75 hover:text-white",
        )}
      >
        Yearly
        <span className="bg-success/20 text-success rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
          −20%
        </span>
      </button>
    </div>
  );
}

// ─────────────────────────── trust strip (hero)

function TrustStrip() {
  return (
    <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/70">
      <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-accent" /> DPDP-compliant</span>
      <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5 text-accent" /> No card for trial</span>
      <span className="inline-flex items-center gap-1.5"><Heart className="size-3.5 text-accent" /> Cancel anytime</span>
      <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-3.5 text-accent" /> CBSE 6–12</span>
    </div>
  );
}

// ─────────────────────────── plan card

function PlanCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const isSchool = plan.id === "school";
  const price = yearly ? plan.yearly : plan.monthly;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-3xl border bg-card p-7 transition-all duration-300",
        plan.highlight
          ? "border-primary shadow-elegant lg:-translate-y-3 lg:scale-[1.02]"
          : "border-border hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
              plan.highlight
                ? "bg-gradient-brand text-primary-foreground border-transparent"
                : "bg-card border-primary/40 text-primary",
            )}
          >
            {plan.highlight && <Sparkles className="size-3" />} {plan.badge}
          </Badge>
        </div>
      )}

      <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
        <plan.icon className="size-5" />
      </div>
      <h3 className="font-display mt-4 text-xl font-semibold">{plan.name}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{plan.tagline}</p>

      <div className="mt-6 min-h-[72px]">
        {isSchool ? (
          <>
            <div className="font-display text-3xl font-semibold tracking-tight">Custom</div>
            <div className="text-muted-foreground mt-1 text-xs">Volume-based · billed annually</div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tracking-tight">₹{price}</span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {yearly ? `Billed yearly · ₹${price * 12}` : "Billed monthly"}
            </div>
          </>
        )}
      </div>

      <div className="text-muted-foreground mt-2 text-[11px] font-medium uppercase tracking-wider">
        {plan.audience}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full",
                plan.highlight ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary",
              )}
            >
              <Check className="size-2.5" />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Link to={isSchool ? "/contact" : "/demo"}>
          <Button
            variant={plan.highlight ? "default" : "outline"}
            className="w-full"
          >
            {plan.ctaLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────── outcome strip (animated counters)

function OutcomeStrip() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">By the numbers</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Real students. Real outcomes.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: 12_400, suffix: "+", label: "Students learning",     sub: "Across pilot cohorts" },
            { value: 22,     suffix: "%",  label: "Avg. mock score lift", sub: "After 6 weeks" },
            { value: 94,     suffix: "%",  label: "Of plans completed",   sub: "Pilot data" },
            { value: 4.8,    suffix: "/5", label: "Parent satisfaction",  sub: "n=864", decimals: 1 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-6 elev-2 text-center">
              <div className="font-display text-4xl font-semibold tracking-tight text-primary md:text-5xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </div>
              <div className="mt-2 text-sm font-medium">{s.label}</div>
              <div className="text-muted-foreground mt-0.5 text-xs">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── comparison table

function ComparisonTable({ yearly }: { yearly: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, CompareRow[]>();
    COMPARE.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return Array.from(map.entries());
  }, []);

  const renderCell = (v: FeatureCell) =>
    v === true ? <Check className="text-success mx-auto size-4" />
    : v === false ? <X className="text-muted-foreground/50 mx-auto size-4" />
    : <span className="text-xs">{v}</span>;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card elev-2">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/40">
          <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="w-[34%] px-5 py-4 text-left">Feature</th>
            {PLANS.map((p) => (
              <th key={p.id} className="px-3 py-4 text-center">
                <div className="text-foreground text-sm font-semibold">{p.name}</div>
                <div className="text-muted-foreground mt-0.5 text-[11px] normal-case">
                  {p.id === "school" ? "Custom" : `₹${yearly ? p.yearly : p.monthly}/mo`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.flatMap(([group, rows]) => [
            <tr key={`g-${group}`} className="bg-muted/20">
              <td colSpan={5} className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {group}
              </td>
            </tr>,
            ...rows.map((r, i) => (
              <tr key={`${group}-${r.label}`} className={cn("border-t", i % 2 === 1 && "bg-muted/10")}>
                <td className="px-5 py-3 font-medium">{r.label}</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-3 py-3 text-center">
                    {renderCell(r.values[p.id])}
                  </td>
                ))}
              </tr>
            )),
          ])}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────── parent confidence

function ParentConfidence() {
  return (
    <section className="container mx-auto max-w-6xl px-6 py-20">
      <SectionHeading
        eyebrow="Parents first"
        title="Built for parents who care, not police"
        description="Smart Lab Online is designed to take the guesswork — and the arguments — out of studying."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { icon: Heart, title: "Calmer evenings", body: "Less nagging. Students know what to do; parents see it happen." },
          { icon: LineChart, title: "Honest progress", body: "Weekly summaries written in plain language. No charts to decode." },
          { icon: ShieldCheck, title: "Privacy-first", body: "Students see exactly what parents see. No surveillance, no surprises." },
        ].map((c) => (
          <div key={c.title} className="hover-lift rounded-2xl border bg-card p-6 elev-2">
            <div className="bg-gradient-brand mb-4 inline-flex size-10 items-center justify-center rounded-xl text-white">
              <c.icon className="size-5" />
            </div>
            <h3 className="font-display text-base font-semibold">{c.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { quote: "Aarav stopped asking 'what should I study today?' That alone is worth the plan.", author: "Megha S.", role: "Parent · Class 9" },
          { quote: "The weekly summary is the first edtech report I actually read end to end.", author: "Rakesh I.", role: "Parent · Class 11" },
          { quote: "Our tuition center adopted School plan in week one. Teachers love the dashboards.", author: "Dr. Priya N.", role: "Director, Vidya Tuition" },
        ].map((t) => (
          <div key={t.author} className="rounded-2xl border bg-card p-6 elev-1">
            <div className="text-primary flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 text-xs">
              <div className="font-semibold">{t.author}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────── lead capture form

function LeadCaptureForm() {
  const submit = useServerFn(submitContact);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanId>("pro");
  const [role, setRole] = useState<"parent" | "student" | "school">("parent");
  const [grade, setGrade] = useState("9");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();

    if (!name || !email) {
      toast.error("Please enter your name and email.");
      return;
    }

    const message = [
      `Pricing lead · plan: ${plan} · role: ${role} · class: ${grade}`,
      phone && `Phone: ${phone}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean).join("\n");

    const gradeVal = role === "school" ? "school" : role === "parent" ? "parent" : grade;

    try {
      setLoading(true);
      await submit({ data: { name, email, grade: gradeVal as any, message } });
      setSubmitted(true);
      toast.success("Got it — an advisor will reach out within one business day.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border bg-card p-10 elev-4 text-center">
        <div className="bg-success/15 text-success mx-auto inline-flex size-14 items-center justify-center rounded-full">
          <Check className="size-7" />
        </div>
        <h3 className="font-display mt-4 text-xl font-semibold">You're on the list</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          A Smart Lab Online advisor will email and WhatsApp you with the best-fit plan and a slot for a live demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border bg-card p-7 elev-4 space-y-4">
      <h3 className="font-display text-lg font-semibold">Get a tailored recommendation</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name">Full name</Label>
          <Input id="lead-name" name="name" required placeholder="Riya Sharma" maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">Email</Label>
          <Input id="lead-email" name="email" type="email" required placeholder="you@example.com" maxLength={255} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-phone">Phone</Label>
          <Input id="lead-phone" name="phone" type="tel" placeholder="+91 9XXXXXXXXX" maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label>I am a</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="school">School / tuition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Interested in</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Student class</Label>
          <Select value={grade} onValueChange={setGrade} disabled={role === "school"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-notes">Anything else? (optional)</Label>
        <Textarea id="lead-notes" name="notes" rows={3} maxLength={500} placeholder="Subjects of focus, school name, preferred time…" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Get my plan recommendation"}
      </Button>
      <p className="text-muted-foreground text-center text-[11px]">
        We'll only contact you about Smart Lab Online. No spam, ever.
      </p>
    </form>
  );
}

// ─────────────────────────── sticky bottom CTA

function StickyPricingCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      // show after 25% scroll, hide near the very bottom (so it doesn't overlap WhatsApp)
      setVisible(y > 600 && y < h - 200);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <div className="elev-5 flex flex-col items-stretch gap-3 rounded-2xl border bg-card/95 p-4 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-full">
              <Sparkles className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">Try Pro free for 14 days</div>
              <div className="text-muted-foreground text-xs">No card needed. Cancel anytime.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="#lead" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm">Talk to advisor</Button>
            </a>
            <Link to="/signup">
              <Button size="sm">Start free trial <ArrowRight className="size-4" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
