import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Loader2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Target,
  AlertTriangle,
  Clock,
  Wand2,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { generateStudyPath, type OnboardingPrefs } from "@/lib/onboarding.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  head: () => ({
    meta: [
      { title: "Personalize your Smart Lab" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
const BOARDS: OnboardingPrefs["board"][] = ["CBSE", "ICSE", "State", "IB", "IGCSE", "Other"];
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Science",
  "Computer Science",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Geography",
];
const GOALS = [
  "Top my class",
  "Crack JEE / NEET",
  "Improve weak subject",
  "Build daily habit",
  "Score 90%+ in boards",
  "Master fundamentals",
  "Olympiad prep",
  "Beat exam anxiety",
];
const WEAKNESSES = [
  "Word problems",
  "Long chapters",
  "Numerical accuracy",
  "Memorizing formulas",
  "Diagrams & labels",
  "Time management",
  "Application questions",
  "Reading comprehension",
];
const TIMES: { value: OnboardingPrefs["preferred_time"]; label: string; emoji: string }[] = [
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "afternoon", label: "Afternoon", emoji: "☀️" },
  { value: "evening", label: "Evening", emoji: "🌆" },
  { value: "night", label: "Night", emoji: "🌙" },
];
const STYLES: { value: OnboardingPrefs["learning_style"]; label: string; desc: string }[] = [
  { value: "visual", label: "Visual", desc: "Videos, diagrams, animations" },
  { value: "reading", label: "Reading", desc: "Notes, summaries, theory" },
  { value: "practice", label: "Practice", desc: "Problems, quizzes, drills" },
  { value: "mixed", label: "Mixed", desc: "A bit of everything" },
];

type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const STEPS = ["Class", "Board", "Subjects", "Goals", "Weak areas", "Preferences"] as const;

function OnboardingPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const generate = useServerFn(generateStudyPath);
  const [step, setStep] = useState<StepId>(0);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<Awaited<ReturnType<typeof generate>>["path"] | null>(null);

  const [form, setForm] = useState<OnboardingPrefs>({
    grade: auth.profile?.grade ?? "",
    board: "CBSE",
    subjects: [],
    goals: [],
    weak_areas: [],
    study_minutes_per_day: 45,
    preferred_time: "evening",
    learning_style: "mixed",
  });

  const progress = useMemo(() => Math.round(((step + (path ? 1 : 0)) / 7) * 100), [step, path]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return !!form.grade;
      case 1: return !!form.board;
      case 2: return form.subjects.length >= 1;
      case 3: return form.goals.length >= 1;
      case 4: return true;
      case 5: return !!form.preferred_time && !!form.learning_style;
      default: return true;
    }
  }, [step, form]);

  const toggle = <K extends "subjects" | "goals" | "weak_areas">(key: K, value: string) => {
    setForm((f) => {
      const has = f[key].includes(value);
      return { ...f, [key]: has ? f[key].filter((v) => v !== value) : [...f[key], value] };
    });
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await generate({ data: form });
      setPath(res.path);
      toast.success("Your personalized study path is ready!");
    } catch (err) {
      toast.error((err as Error).message || "Could not generate study path");
    } finally {
      setLoading(false);
    }
  };

  if (path) return <SuccessView path={path} onContinue={() => nav({ to: "/dashboard" })} />;

  return (
    <AuthShell
      title={loading ? "Crafting your study path…" : titleFor(step)}
      subtitle={loading ? "Our AI is matching topics to your goals and pace." : subtitleFor(step)}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                i < step && "bg-primary/10 text-primary",
                i === step && "bg-primary text-primary-foreground",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          {step === 0 && (
            <Section icon={<GraduationCap className="h-4 w-4" />} title="Which class are you in?">
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <Chip key={g} active={form.grade === g} onClick={() => setForm({ ...form, grade: g })}>
                    Class {g}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {step === 1 && (
            <Section icon={<BookOpen className="h-4 w-4" />} title="Pick your board">
              <div className="grid grid-cols-3 gap-2">
                {BOARDS.map((b) => (
                  <Chip key={b} active={form.board === b} onClick={() => setForm({ ...form, board: b })}>
                    {b}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section
              icon={<BookOpen className="h-4 w-4" />}
              title="Choose your subjects"
              hint={`${form.subjects.length} selected • pick at least 1`}
            >
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <Chip key={s} active={form.subjects.includes(s)} onClick={() => toggle("subjects", s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section
              icon={<Target className="h-4 w-4" />}
              title="What are your goals?"
              hint={`${form.goals.length} selected`}
            >
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Chip key={g} active={form.goals.includes(g)} onClick={() => toggle("goals", g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Where do you struggle?"
              hint="Optional — helps our AI focus practice"
            >
              <div className="flex flex-wrap gap-2">
                {WEAKNESSES.map((w) => (
                  <Chip key={w} active={form.weak_areas.includes(w)} onClick={() => toggle("weak_areas", w)}>
                    {w}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <Section icon={<Clock className="h-4 w-4" />} title="Daily study time">
                <div className="rounded-lg border border-input p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{form.study_minutes_per_day}</span>
                    <span className="text-xs text-muted-foreground">minutes / day</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={5}
                    value={form.study_minutes_per_day}
                    onChange={(e) => setForm({ ...form, study_minutes_per_day: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>15m</span><span>1h</span><span>2h</span><span>3h</span>
                  </div>
                </div>
              </Section>

              <Section icon={<Clock className="h-4 w-4" />} title="Best study window">
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map((t) => (
                    <Chip
                      key={t.value}
                      active={form.preferred_time === t.value}
                      onClick={() => setForm({ ...form, preferred_time: t.value })}
                    >
                      <span className="mr-1">{t.emoji}</span>{t.label}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section icon={<Wand2 className="h-4 w-4" />} title="How do you learn best?">
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm({ ...form, learning_style: s.value })}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-soft",
                        form.learning_style === s.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-input hover:border-primary/40 hover:bg-muted",
                      )}
                    >
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" />
            {step < 5
              ? "Every answer trains your AI tutor to skip what you know and drill what you don't."
              : "We'll generate a week-1 study path tailored to you in ~10 seconds."}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => (Math.max(0, s - 1) as StepId))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => ((s + 1) as StepId))}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance || loading}
                onClick={submit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" /> Generate my study path
              </button>
            )}
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function titleFor(step: StepId) {
  return [
    "Let's pick your class",
    "What's your board?",
    "Which subjects matter most?",
    "Set your learning goals",
    "Tell us your weak spots",
    "Tune your study rhythm",
  ][step];
}
function subtitleFor(step: StepId) {
  return [
    "We'll align curriculum, pacing, and practice to your grade.",
    "Different boards, different priorities — we'll adapt.",
    "Add as many as you want — you can change this later.",
    "Goals shape the difficulty and depth of your daily plan.",
    "Honesty here means smarter practice, faster wins.",
    "How long, when, and how — your AI tutor adapts to it.",
  ][step];
}

function Section({
  icon, title, hint, children,
}: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-semibold">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-medium transition-soft",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-input bg-background hover:border-primary/40 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  const steps = [
    "Reading your goals",
    "Mapping topics to your class",
    "Calibrating difficulty",
    "Writing your week-1 plan",
  ];
  return (
    <div className="space-y-3 py-4">
      {steps.map((s, i) => (
        <div
          key={s}
          className="flex items-center gap-3 rounded-lg border border-input bg-card p-3 text-sm"
          style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {s}…
        </div>
      ))}
    </div>
  );
}

function SuccessView({
  path, onContinue,
}: {
  path: Awaited<ReturnType<ReturnType<typeof useServerFn<typeof generateStudyPath>>>>["path"];
  onContinue: () => void;
}) {
  return (
    <AuthShell title="Your study path is live" subtitle="Crafted by AI for your class, goals, and pace.">
      <div className="space-y-5">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <Trophy className="h-4 w-4" /> Achievement unlocked
          </div>
          <p className="text-sm text-foreground">{path.summary}</p>
        </div>

        {path.focus_subjects?.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Focus subjects</div>
            <div className="flex flex-wrap gap-1.5">
              {path.focus_subjects.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {path.weekly_plan?.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Your week-1 plan</div>
            <div className="space-y-1.5">
              {path.weekly_plan.map((d, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-input p-2.5 text-xs">
                  <span className="w-10 font-semibold text-primary">{d.day}</span>
                  <div className="flex-1">
                    <div className="font-medium">{d.subject}</div>
                    <div className="text-muted-foreground">{d.topic}</div>
                  </div>
                  <span className="text-muted-foreground">{d.minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {path.first_week_goals?.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">First-week goals</div>
            <ul className="space-y-1.5">
              {path.first_week_goals.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onContinue}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95"
        >
          Open my dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </AuthShell>
  );
}
