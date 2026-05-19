import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Brain, Clock, Sparkles, BookOpen, Wand2, ShieldCheck, Languages } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/ai-tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — Smart Lab Online" },
      { name: "description", content: "A 24/7 Socratic AI tutor that explains concepts, answers doubts, and quizzes students — aligned to the CBSE syllabus for Classes 6–12." },
      { property: "og:title", content: "AI Tutor — Smart Lab Online" },
      { property: "og:description", content: "Socratic AI tutoring for CBSE students, available any time." },
    ],
  }),
  component: AiTutorMarketing,
});

function ChatPreview() {
  const msgs = [
    { role: "user", text: "Why does light bend when it enters water?" },
    { role: "ai", text: "Good question — before I explain, what do you think changes when light moves from air to water?" },
    { role: "user", text: "Its speed?" },
    { role: "ai", text: "Exactly. Light slows down in water, and that change in speed bends its path. That's called refraction." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <div className="bg-background rounded-xl border p-5">
        <div className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">Live tutoring session</div>
        <div className="space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={
                m.role === "user"
                  ? "bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm"
                  : "bg-muted max-w-[80%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm"
              }>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[
          { title: "Concept detected", value: "Refraction · Light" },
          { title: "Class · Chapter", value: "Class 10 · Physics 10.1" },
          { title: "Confidence", value: "Building — 62%" },
        ].map((c) => (
          <div key={c.title} className="bg-background rounded-xl border p-4">
            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{c.title}</div>
            <div className="mt-1 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiTutorMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="AI Tutor"
      title={<>Like a private tutor — <span className="text-accent">always on call</span>.</>}
      description="Students chat with a Socratic AI that knows their syllabus, their weak areas, and their learning style. Doubts get cleared the moment they appear."
      primaryCta={{ label: "Try the AI Tutor", to: "/demo" }}
      secondaryCta={{ label: "See all features", to: "/features" }}
      heroVisual={<ChatPreview />}
      explanation={{
        title: "Not just answers — understanding",
        body: "Our AI tutor doesn't dump solutions. It asks the right questions, surfaces misconceptions, and rewires understanding from first principles.",
        bullets: [
          "Socratic prompting builds reasoning, not dependence",
          "Knows every chapter of the CBSE syllabus for Classes 6–12",
          "Remembers what each student already knows (and forgot)",
          "Switches between English and Hinglish on request",
          "Generates worked examples and follow-up quizzes on demand",
        ],
      }}
      preview={{
        title: "See a real session",
        description: "Every conversation is captured as concept-level signal — feeding the student's mastery score in real time.",
        node: <ChatPreview />,
      }}
      benefits={[
        { icon: Clock, title: "24/7 availability", description: "No queues, no waiting for a teacher's free period." },
        { icon: Brain, title: "Builds reasoning", description: "Students solve, not just copy. Long-term retention goes up." },
        { icon: BookOpen, title: "Syllabus-aware", description: "Pinned to the exact chapter, section, and learning objective." },
        { icon: Sparkles, title: "Personalized tone", description: "Adapts difficulty and tone to each student's grade and confidence." },
        { icon: ShieldCheck, title: "Safe and moderated", description: "Built-in safety filters for school-age learners." },
        { icon: Languages, title: "Bilingual support", description: "Switches between English and Hinglish on the fly." },
      ]}
      outcomes={[
        { stat: "3.4×", label: "Faster doubt resolution", sub: "vs. waiting for the next class" },
        { stat: "92%", label: "Students felt 'understood'", sub: "Pilot survey, n=412" },
        { stat: "+18%", label: "Concept retention", sub: "After 30-day follow-up" },
        { stat: "24/7", label: "Always available", sub: "Including weekends & exams" },
      ]}
      comparison={{
        rows: [
          { label: "Available outside class hours", us: true, them: false },
          { label: "Knows the student's history", us: true, them: false },
          { label: "Aligned to CBSE chapter & section", us: true, them: "Generic" },
          { label: "Socratic style (asks, not tells)", us: true, them: false },
          { label: "Cost per question", us: "Included", them: "Per session" },
        ],
      }}
      finalCta={{
        title: "Put a Socratic tutor in every student's pocket",
        description: "Book a live walkthrough — we'll show the AI tutor handling your toughest chapter.",
        to: "/demo",
        label: "Book a demo",
      }}
    />
  );
}
