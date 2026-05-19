import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, ShieldCheck, Timer, Brain, GraduationCap, Sparkles, BarChart3, Target } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/test-engine")({
  head: () => ({
    meta: [
      { title: "Test Engine — Smart Lab Online" },
      { name: "description", content: "Adaptive tests, CBSE-aligned mock exams, and instant AI-graded feedback." },
      { property: "og:title", content: "Test Engine — Smart Lab Online" },
      { property: "og:description", content: "Adaptive testing that gets harder when you're right and gentler when you're stuck." },
    ],
  }),
  component: TestEngineMarketing,
});

function TestPreview() {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
      <div className="bg-background rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Class 10 · Mathematics · Mock</div>
            <div className="mt-1 text-sm font-semibold">Question 14 of 25 · adaptive</div>
          </div>
          <span className="bg-warning/15 text-warning inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <Timer className="size-3.5" /> 18:42
          </span>
        </div>
        <div className="mt-4 text-sm">
          If the roots of <span className="font-medium">x² − 5x + k = 0</span> are equal, what is the value of <span className="font-medium">k</span>?
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {["6.25", "5", "2.5", "10"].map((o, i) => (
            <div key={o} className={`rounded-lg border px-3 py-2 text-sm ${i === 0 ? "border-primary bg-primary/5" : ""}`}>
              <span className="text-muted-foreground mr-2 text-xs">{String.fromCharCode(65 + i)}</span>{o}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: "Difficulty", value: "Adapting · Hard" },
          { label: "Confidence", value: "78%" },
          { label: "Predicted score", value: "84 / 100" },
        ].map((c) => (
          <div key={c.label} className="bg-background rounded-xl border p-4">
            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{c.label}</div>
            <div className="mt-1 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestEngineMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Test Engine"
      title={<>Adaptive tests that <span className="text-accent">tell the truth</span>.</>}
      description="Mock exams, chapter tests, and quick quizzes — all CBSE-aligned, all auto-graded, all linked back to mastery."
      primaryCta={{ label: "Take a sample test", to: "/demo" }}
      secondaryCta={{ label: "See AI grading", to: "/ai-learning" }}
      heroVisual={<TestPreview />}
      explanation={{
        title: "Tests that adapt, scores that mean something",
        body: "Smart Lab Online's engine adjusts difficulty in real time, grades subjective answers with AI, and feeds every result back into the mastery model.",
        bullets: [
          "CBSE-aligned chapter, term, and mock exams",
          "Adaptive difficulty per student, per question",
          "AI-graded long-answer questions with rubric breakdown",
          "Confidence-aware: distinguishes 'guessed' from 'knew it'",
          "Predicted exam score, updated continuously",
        ],
      }}
      preview={{
        title: "Live adaptive question",
        description: "Difficulty, confidence, and predicted score update with every response.",
        node: <TestPreview />,
      }}
      benefits={[
        { icon: Brain, title: "Truer assessment", description: "Adaptive difficulty exposes real understanding." },
        { icon: ClipboardCheck, title: "AI-graded long answers", description: "Rubric-based, with suggestions." },
        { icon: Target, title: "Exam-aligned", description: "Mirrors CBSE blueprints, mark schemes, and weightages." },
        { icon: BarChart3, title: "Feeds mastery", description: "Every test result updates concept scores." },
        { icon: ShieldCheck, title: "Fair & monitored", description: "Built-in anti-cheat for in-class use." },
        { icon: GraduationCap, title: "Predicted score", description: "Live exam-readiness number per student." },
      ]}
      outcomes={[
        { stat: "+22%", label: "Average mock score lift", sub: "After 6 weeks" },
        { stat: "94%", label: "AI–teacher grading agreement" },
        { stat: "Instant", label: "Feedback delivery" },
        { stat: "100%", label: "CBSE blueprint coverage" },
      ]}
      comparison={{
        theirsLabel: "Static test platforms",
        rows: [
          { label: "Adapts difficulty per question", us: true, them: false },
          { label: "AI-grades long answers", us: true, them: false },
          { label: "Predicts exam score live", us: true, them: false },
          { label: "Feeds back into mastery score", us: true, them: false },
          { label: "Anti-cheat for in-class", us: true, them: "Limited" },
        ],
      }}
    />
  );
}
