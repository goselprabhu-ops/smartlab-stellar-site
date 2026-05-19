import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, HelpCircle, Wand2, Target, Brain, Calculator, Sigma, Atom } from "lucide-react";
import { createThread } from "@/lib/tutor.functions";
import tutorMascot from "@/assets/tutor-mascot.png";

export const Route = createFileRoute("/_authenticated/student/ai-tutor/")({
  component: AiTutorEmpty,
});

const SUGGESTIONS = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain quadratic equations like I'm 12 with a real-life example." },
  { icon: HelpCircle, label: "Solve a doubt", prompt: "Why does light bend when entering water? Use a clear analogy." },
  { icon: Wand2, label: "Quiz me", prompt: "Generate 5 MCQs on the French Revolution with answers and one-line explanations." },
  { icon: Target, label: "Study plan", prompt: "Make a 30-minute revision plan for Newton's Laws — concepts, practice, and quick recall." },
  { icon: Calculator, label: "Step-by-step math", prompt: "Solve: 2x² − 5x − 3 = 0 step by step and explain each move." },
  { icon: Atom, label: "Science walkthrough", prompt: "Walk me through photosynthesis: inputs, process, outputs, and why it matters." },
];

const WIDGETS = [
  { icon: Sigma, title: "Concept explainer", desc: "Get crystal-clear breakdowns of any topic." },
  { icon: Brain, title: "Doubt solver", desc: "Drop a question — get the why, not just the what." },
  { icon: Wand2, title: "Quiz generator", desc: "Practice MCQs tailored to your syllabus." },
  { icon: Target, title: "Study suggestions", desc: "Smart next steps based on what you've learned." },
];

function AiTutorEmpty() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createThread);

  const start = useMutation({
    mutationFn: (firstMessage?: string) =>
      createFn({ data: {} }).then((res) => ({ ...res, firstMessage })),
    onSuccess: async ({ thread, firstMessage }) => {
      await qc.invalidateQueries({ queryKey: ["tutor-threads"] });
      navigate({
        to: "/student/ai-tutor/$threadId",
        params: { threadId: thread.id },
        search: firstMessage ? ({ q: firstMessage } as never) : undefined,
      });
    },
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="text-center">
          <div className="from-primary/20 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br to-purple-500/20 shadow-lg">
            <img src={tutorMascot} alt="AI tutor" className="h-14 w-14" />
          </div>
          <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight md:text-3xl">
            Hi! I'm your AI tutor.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Ask me to explain a concept, solve a doubt, or quiz you on anything from your syllabus.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => start.mutate(s.prompt)}
                disabled={start.isPending}
                className="hover:border-primary/40 hover:bg-primary/5 group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition disabled:opacity-50"
              >
                <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{s.prompt}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What I can do
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {WIDGETS.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="bg-muted/40 rounded-xl border p-3">
                  <Icon className="text-primary h-4 w-4" />
                  <div className="mt-2 text-xs font-semibold">{w.title}</div>
                  <div className="text-muted-foreground mt-1 text-[11px] leading-relaxed">{w.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => start.mutate(undefined)}
            disabled={start.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {start.isPending ? "Starting…" : "Start a blank chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
