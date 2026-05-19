import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Target, Zap, MessageSquare, LineChart, Repeat, Lightbulb } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/ai-learning")({
  head: () => ({
    meta: [
      { title: "AI Learning — Smart Lab Online" },
      { name: "description", content: "AI that listens, adapts, and remediates. See how Smart Lab Online's AI engine personalizes every student's learning journey in real time." },
      { property: "og:title", content: "AI Learning — Smart Lab Online" },
      { property: "og:description", content: "The AI engine behind Smart Lab Online." },
    ],
  }),
  component: AiLearningPage,
});

const capabilities = [
  { icon: Brain, title: "Weakness detection", description: "Pinpoints the exact micro-concept the student misunderstood — not just the topic." },
  { icon: Sparkles, title: "Personalized remediation", description: "Auto-generates simplified notes, flashcards, and micro-quizzes for every weak area." },
  { icon: Target, title: "Adaptive testing", description: "Tests get harder or easier in real time based on confidence and response patterns." },
  { icon: MessageSquare, title: "AI tutor chat", description: "24/7 Socratic tutor that asks questions back instead of just giving answers." },
  { icon: Repeat, title: "Spaced repetition", description: "Forgetting-curve modeling schedules revision before knowledge decays." },
  { icon: LineChart, title: "Mastery scoring", description: "A single, calibrated number per concept — backed by recall, accuracy, and retention." },
  { icon: Zap, title: "Real-time adaptation", description: "Every answer reshapes the next step. No two students follow the same path." },
  { icon: Lightbulb, title: "AI-generated content", description: "Explanations, examples, and practice items generated on demand for each student." },
];

function AiLearningPage() {
  return (
    <PublicShell
      eyebrow="The AI Engine"
      title={<>Adaptive learning, <span className="text-gradient bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">truly personal</span></>}
      description="Smart Lab Online's AI doesn't just suggest content — it builds a living memory of every student and continuously rewrites their study plan."
      primaryCta={{ label: "See it in action", to: "/demo" }}
      secondaryCta={{ label: "Read features", to: "/features" }}
      features={capabilities}
    />
  );
}
