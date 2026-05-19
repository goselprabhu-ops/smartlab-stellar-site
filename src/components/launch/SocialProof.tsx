import { Star, Users, School, TrendingUp } from "lucide-react";

const STATS = [
  { icon: Users, label: "Early learners on waitlist", value: "12,400+" },
  { icon: School, label: "Schools in pilot", value: "38" },
  { icon: TrendingUp, label: "Avg. score improvement", value: "+27%" },
  { icon: Star, label: "Early access rating", value: "4.9 / 5" },
];

const QUOTES = [
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
];

export function SocialProof() {
  return (
    <section className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 elev-1">
            <s.icon className="size-5 text-primary" />
            <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{s.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {QUOTES.map((q) => (
          <figure key={q.name} className="rounded-2xl border bg-card p-6 elev-1">
            <div className="mb-3 flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-foreground">"{q.quote}"</blockquote>
            <figcaption className="mt-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{q.name}</span> · {q.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
