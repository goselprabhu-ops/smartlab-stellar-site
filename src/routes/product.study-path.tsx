import { createFileRoute } from "@tanstack/react-router";
import { Map, Compass, Calendar, Repeat, Target, Brain, Zap, TrendingUp } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/study-path")({
  head: () => ({
    meta: [
      { title: "Smart Study Path — Smart Lab Online" },
      { name: "description", content: "An adaptive daily study plan that auto-rebuilds based on mastery, retention forecast, and CBSE pacing." },
      { property: "og:title", content: "Smart Study Path — Smart Lab Online" },
      { property: "og:description", content: "AI-built daily plans that adapt to every student." },
    ],
  }),
  component: StudyPathMarketing,
});

function PathPreview() {
  const sessions = [
    { time: "20 min", concept: "Quadratic equations · factorization", subject: "Mathematics", tag: "Weak area" },
    { time: "15 min", concept: "Newton's third law", subject: "Science", tag: "New" },
    { time: "12 min", concept: "French Revolution · causes", subject: "Social", tag: "Continue" },
    { time: "10 min", concept: "12 vocabulary cards", subject: "English", tag: "Spaced revision" },
  ];
  return (
    <div className="bg-background rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today · 4 sessions</div>
          <div className="font-display mt-1 text-lg font-semibold">~ 57 minutes</div>
        </div>
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
          <Brain className="size-3.5" /> Auto-built by AI
        </span>
      </div>
      <ul className="mt-4 divide-y">
        {sessions.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium">{s.concept}</div>
                <div className="text-xs text-muted-foreground">{s.subject} · {s.time}</div>
              </div>
            </div>
            <span className="text-xs font-medium text-accent">{s.tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudyPathMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Smart Study Path"
      title={<>One plan, <span className="text-accent">rebuilt daily</span>, just for them.</>}
      description="A living study path that mixes new material, weak-area drills, and spaced revision — so students always know exactly what to do next."
      primaryCta={{ label: "See a sample path", to: "/demo" }}
      secondaryCta={{ label: "How the AI works", to: "/ai-learning" }}
      heroVisual={<PathPreview />}
      explanation={{
        title: "The plan that thinks for itself",
        body: "Every night, the AI looks at what was mastered, what was forgotten, what's coming up at school, and how much time the student has — then writes tomorrow's plan.",
        bullets: [
          "Built from mastery state, retention forecast, and goals",
          "Stays aligned to the CBSE pacing of the student's school",
          "Shorter on busy days, deeper on weekends",
          "Reintroduces weak concepts before they decay",
          "Transparent — students can see why each session is there",
        ],
      }}
      preview={{
        title: "A real student's plan, today",
        description: "Notice the mix: one weak-area drill, one new concept, one continuation, one spaced revision.",
        node: <PathPreview />,
      }}
      benefits={[
        { icon: Compass, title: "Always know what's next", description: "No more 'what should I study today?'" },
        { icon: Target, title: "Focused on real gaps", description: "Time spent where it actually moves the needle." },
        { icon: Repeat, title: "Spaced revision built-in", description: "Forgetting curve modeled per student." },
        { icon: Calendar, title: "Fits their week", description: "Aligned to school timetable and energy." },
        { icon: Zap, title: "Auto-rebalances", description: "Falls behind? The plan adjusts, not the student." },
        { icon: Map, title: "Aligned to CBSE pacing", description: "Stays in lockstep with the school's syllabus." },
      ]}
      outcomes={[
        { stat: "+27%", label: "Daily completion rate", sub: "vs. self-made plans" },
        { stat: "1.6×", label: "Concepts mastered/week" },
        { stat: "−42%", label: "'I don't know what to study' moments" },
        { stat: "94%", label: "Of plans completed", sub: "Pilot cohort" },
      ]}
      comparison={{
        theirsLabel: "Static planners",
        rows: [
          { label: "Rebuilt daily based on performance", us: true, them: false },
          { label: "Includes spaced revision", us: true, them: false },
          { label: "Aware of upcoming school tests", us: true, them: false },
          { label: "Reintroduces forgotten concepts", us: true, them: false },
          { label: "Setup effort", us: "0 min", them: "Hours/week" },
        ],
      }}
    />
  );
}
