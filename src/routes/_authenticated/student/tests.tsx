import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, Timer, Brain, Trophy, Sparkles, Play } from "lucide-react";
import { FeatureShell } from "@/components/FeatureShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/student/tests")({
  head: () => ({ meta: [{ title: "Tests — Smart Lab Online" }] }),
  component: TestsPage,
});

const upcoming = [
  { title: "Class 9 · Polynomials · Diagnostic", duration: "20 min", questions: 12, kind: "Adaptive", due: "Today" },
  { title: "Class 9 · Motion · Concept check", duration: "15 min", questions: 10, kind: "Micro test", due: "Tomorrow" },
  { title: "Weekly mixed · Math + Science", duration: "45 min", questions: 30, kind: "Full test", due: "This Sunday" },
];

function TestsPage() {
  return (
    <FeatureShell
      eyebrow="Tests & Quizzes"
      title="Adaptive testing built for mastery"
      description="Every test you take feeds the engine. Difficulty adjusts in real time and weak areas trigger instant remediation."
      status="live"
      groups={[
        {
          title: "Test formats",
          items: [
            { icon: ClipboardCheck, title: "Diagnostic", description: "Pinpoint exactly where you stand on a chapter in under 20 minutes." },
            { icon: Brain, title: "Adaptive quiz", description: "Difficulty rises and falls based on your live performance." },
            { icon: Timer, title: "Micro test", description: "5–10 question pulses to keep concepts warm." },
            { icon: Trophy, title: "Full mock", description: "Exam-pattern simulation with timing and sectioning." },
            { icon: Sparkles, title: "AI-generated", description: "Tests built on demand from your syllabus and weakness map." },
            { icon: Play, title: "Practice mode", description: "No timer, instant feedback — learn while you attempt." },
          ],
        },
      ]}
    >
      <section className="rounded-2xl border bg-card p-6 elev-2">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Scheduled for you</h2>
          <Link to="/student/quizzes" className="text-sm font-medium text-primary hover:underline">All quizzes →</Link>
        </div>
        <ul className="mt-4 divide-y">
          {upcoming.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.questions} questions · {t.duration}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{t.kind}</Badge>
                <span className="text-xs text-muted-foreground">{t.due}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </FeatureShell>
  );
}
