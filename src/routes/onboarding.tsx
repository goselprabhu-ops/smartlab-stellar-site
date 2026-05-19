import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2, GraduationCap, School, User, ArrowRight, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { updateProfile } from "@/lib/auth.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const grades = ["6", "7", "8", "9", "10", "11", "12"];

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  grade: z.string().trim().max(2),
  school: z.string().trim().max(200).optional(),
});

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  head: () => ({
    meta: [
      { title: "Welcome — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const save = useServerFn(updateProfile);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    full_name: auth.profile?.full_name ?? "",
    grade: auth.profile?.grade ?? "",
    school: auth.profile?.school ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const next = () => {
    setErrors({});
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      return setErrors({ full_name: "Enter your full name" });
    }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      return setErrors(map);
    }
    setLoading(true);
    try {
      await save({
        data: {
          full_name: parsed.data.full_name,
          grade: parsed.data.grade,
          school: parsed.data.school || undefined,
        },
      });
      toast.success("You're all set!");
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Tell us about you" : "One last thing"}
      subtitle={step === 1 ? "We'll personalize your Smart Lab to fit your goals." : "Pick your class so we can tailor your study path."}
    >
      <div className="mb-6 flex items-center gap-2 text-xs">
        <Step n={1} active={step >= 1} label="Profile" />
        <div className="h-px flex-1 bg-border" />
        <Step n={2} active={step >= 2} label="Class" />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <AuthField
            label="Full name"
            required
            icon={<User className="h-4 w-4" />}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            error={errors.full_name}
            placeholder="Aanya Sharma"
          />
          <AuthField
            label="School (optional)"
            icon={<School className="h-4 w-4" />}
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            placeholder="DPS RK Puram"
          />
          <button
            onClick={next}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium">
              <GraduationCap className="h-4 w-4 text-primary" /> Which class are you in?
            </div>
            <div className="grid grid-cols-4 gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, grade: g })}
                  className={cn(
                    "rounded-lg border py-3 text-sm font-semibold transition-soft",
                    form.grade === g
                      ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                      : "border-input hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  Class {g}
                </button>
              ))}
            </div>
            {errors.grade && <p className="mt-2 text-xs text-destructive">{errors.grade}</p>}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" />
            Your AI tutor will calibrate your first study path in under a minute.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-input px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving…" : "Finish & go to dashboard"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

function Step({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {n}
      </span>
      <span className={cn("font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}
