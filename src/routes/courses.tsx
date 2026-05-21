import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FlaskConical, Calculator, Atom, Globe2, Languages, Sparkles, Trophy } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses · CBSE Classes 6–12 — Smart Lab Online" },
      { name: "description", content: "Complete CBSE curriculum coverage for Classes 6–12 with AI-personalized learning paths across Mathematics, Science, Social Studies, English, and more." },
      { property: "og:title", content: "Courses · CBSE Classes 6–12 — Smart Lab Online" },
      { property: "og:description", content: "AI-personalized CBSE courses for Classes 6–12." },
    ],
  }),
  component: CoursesPage,
});

const subjects = [
  { icon: Calculator, title: "Mathematics", description: "Algebra, geometry, trigonometry, and calculus with step-by-step AI walkthroughs." },
  { icon: Atom, title: "Science (Phy · Chem · Bio)", description: "Concept-first explanations, interactive diagrams, and lab simulations." },
  { icon: Globe2, title: "Social Studies", description: "History, geography, civics, and economics taught through context, not memorization." },
  { icon: Languages, title: "English & Hindi", description: "Reading comprehension, grammar drills, and writing practice with instant AI feedback." },
  { icon: FlaskConical, title: "Class 11–12 Streams", description: "Stream-specific deep dives for Science, Commerce, and Humanities aspirants." },
  { icon: Trophy, title: "Olympiad & Foundation", description: "Higher-order thinking tracks for NTSE, NMMS, and Olympiad preparation." },
];

function CoursesPage() {
  return (
    <PublicShell
      eyebrow="Catalog · CBSE 6–12"
      title={<>Complete CBSE coverage, <span className="text-gradient bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">adaptive by design</span></>}
      description="Every subject is broken into micro-concepts. The AI maps each student's journey and surfaces exactly the next concept they need."
      primaryCta={{ label: "Experience Smart Lab Online", to: "/signup" }}
      secondaryCta={{ label: "Book a demo", to: "/demo" }}
      features={subjects}
    >
      <section className="container mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl border bg-card p-10 elev-3">
          <div className="grid gap-10 lg:grid-cols-3">
            {[
              { icon: BookOpen, k: "120+", v: "Chapters mapped" },
              { icon: Sparkles, k: "2,400+", v: "Micro-concepts" },
              { icon: Trophy, k: "15,000+", v: "Practice questions" },
            ].map((s) => (
              <div key={s.v}>
                <s.icon className="text-primary mb-3 size-6" />
                <div className="font-display text-4xl font-semibold">{s.k}</div>
                <div className="text-sm text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
