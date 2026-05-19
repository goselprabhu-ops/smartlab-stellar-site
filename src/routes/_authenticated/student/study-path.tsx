import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Target, Repeat, Brain, Zap, MapPin } from "lucide-react";
import { FeatureShell } from "@/components/FeatureShell";

export const Route = createFileRoute("/_authenticated/student/study-path")({
  head: () => ({ meta: [{ title: "Study Path — Smart Lab Online" }] }),
  component: StudyPathPage,
});

function StudyPathPage() {
  const today = [
    { time: "20 min", concept: "Quadratic equations · factorization", subject: "Mathematics", status: "Next" },
    { time: "15 min", concept: "Newton's third law", subject: "Science", status: "Queued" },
    { time: "12 min", concept: "French Revolution · causes", subject: "Social Studies", status: "Queued" },
    { time: "10 min", concept: "Vocabulary review · 12 cards", subject: "English", status: "Spaced repetition" },
  ];

  return (
    <FeatureShell
      eyebrow="Today's plan"
      title="Your adaptive study path"
      description="The AI rebuilds this list every day based on what you mastered, what you forgot, and what's due next."
      status="live"
      groups={[
        {
          title: "How the path is built",
          items: [
            { icon: Brain, title: "Mastery state", description: "Concepts below threshold get prioritized first." },
            { icon: Repeat, title: "Retention forecast", description: "Concepts about to be forgotten get scheduled before they decay." },
            { icon: Target, title: "Goal alignment", description: "Your weekly subject goals shape the daily mix." },
            { icon: Sparkles, title: "AI nudges", description: "If you're on a streak in a topic, the AI pushes a harder challenge." },
            { icon: Zap, title: "Energy fit", description: "Shorter sessions on busy days, longer ones on weekends." },
            { icon: MapPin, title: "Chapter pacing", description: "Stays aligned with your school's CBSE calendar where possible." },
          ],
        },
      ]}
    >
      <section className="rounded-2xl border bg-card p-6 elev-2">
        <h2 className="font-display text-lg font-semibold">Today, 4 sessions</h2>
        <p className="mt-1 text-xs text-muted-foreground">Total ~ 57 minutes</p>
        <ul className="mt-4 divide-y">
          {today.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-4">
                <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium">{s.concept}</div>
                  <div className="text-xs text-muted-foreground">{s.subject} · {s.time}</div>
                </div>
              </div>
              <span className="text-xs font-medium text-primary">{s.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </FeatureShell>
  );
}
