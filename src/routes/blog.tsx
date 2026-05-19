import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Smart Lab Online" },
      { name: "description", content: "Insights on adaptive learning, exam strategy, and the science of mastery from the Smart Lab Online team." },
      { property: "og:title", content: "Blog — Smart Lab Online" },
      { property: "og:description", content: "Insights on adaptive learning and the science of mastery." },
    ],
  }),
  component: BlogPage,
});

const posts = [
  {
    slug: "forgetting-curve-explained",
    tag: "Learning Science",
    title: "The forgetting curve, and why your child re-learns the same chapter",
    excerpt: "Ebbinghaus showed us that memory decays predictably. Here's how spaced repetition flips that into long-term retention.",
    date: "May 12, 2026",
  },
  {
    slug: "what-is-a-micro-concept",
    tag: "Product",
    title: "What's a micro-concept, and why we built our engine around it",
    excerpt: "A chapter is too big. A topic is too vague. Real mastery happens at the micro-concept level — the smallest testable idea.",
    date: "May 4, 2026",
  },
  {
    slug: "ai-tutor-vs-human-tutor",
    tag: "AI",
    title: "AI tutor or human tutor — which actually works better in 2026?",
    excerpt: "The honest answer: both, in different ways. We compared 200 student sessions to find out where each one wins.",
    date: "April 22, 2026",
  },
];

function BlogPage() {
  return (
    <main className="container mx-auto max-w-5xl px-6 py-20">
      <SectionHeading
        eyebrow="Smart Lab Journal"
        title="Field notes on learning, mastery, and AI"
        description="Practical writing for parents, teachers, and students who care about how learning actually works."
        align="center"
      />

      <div className="mt-16 space-y-6">
        {posts.map((p) => (
          <article key={p.slug} className="hover-lift group rounded-2xl border bg-card p-8 elev-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline">{p.tag}</Badge>
              <span>{p.date}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight group-hover:text-primary">
              {p.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            <span className="mt-4 inline-block text-sm font-medium text-primary">Coming soon →</span>
          </article>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border bg-gradient-soft p-10 text-center">
        <h3 className="font-display text-2xl font-semibold">Want these in your inbox?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We send one essay a fortnight on learning, AI, and academic mastery. No spam.
        </p>
        <Link to="/contact" className="bg-primary text-primary-foreground mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90">
          Get on the list
        </Link>
      </div>
    </main>
  );
}
