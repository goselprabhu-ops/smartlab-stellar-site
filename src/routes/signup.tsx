import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Lock, User, GraduationCap, Users, BookUser, Shield, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { cn } from "@/lib/utils";

type Role = "student" | "parent" | "teacher";

const roles: { value: Role; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { value: "student", label: "Student", desc: "Classes 6–12", icon: GraduationCap },
  { value: "parent", label: "Parent", desc: "Track your child", icon: Users },
  { value: "teacher", label: "Teacher", desc: "Run classrooms", icon: BookUser },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
  role: z.enum(["student", "parent", "teacher"]),
});

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

function strength(pwd: string) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s; // 0..4
}

function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student" as Role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!agree) return toast.error("Please accept the terms to continue.");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { full_name: parsed.data.full_name, role: parsed.data.role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("We sent a 6-digit code to your email.");
    nav({ to: "/verify-otp", search: { email: parsed.data.email } });
  };

  const s = strength(form.password);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][s];

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join thousands of students mastering CBSE with AI."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium">I am a…</div>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const active = form.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={cn(
                    "group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-soft",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-input hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <r.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.desc}</div>
                  {active && (
                    <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Shield className="h-3 w-3" /> Admin access is granted separately by your school.
          </p>
        </div>

        <AuthField
          label="Full name"
          required
          icon={<User className="h-4 w-4" />}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          error={errors.full_name}
          placeholder="Aanya Sharma"
          autoComplete="name"
        />
        <AuthField
          label="Email"
          type="email"
          required
          icon={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          placeholder="you@school.com"
          autoComplete="email"
        />
        <div>
          <AuthField
            label="Password"
            type="password"
            required
            icon={<Lock className="h-4 w-4" />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            placeholder="Min 8 chars, 1 number, 1 uppercase"
            autoComplete="new-password"
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full",
                      i < s ? (s >= 3 ? "bg-emerald-500" : s === 2 ? "bg-amber-500" : "bg-rose-500") : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">{strengthLabel}</span>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          I agree to the{" "}
          <Link to="/" className="text-primary hover:underline">Terms</Link> and{" "}
          <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>.
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next="/onboarding" />
    </AuthShell>
  );
}
