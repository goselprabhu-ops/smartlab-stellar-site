import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  Mail, Lock, User, GraduationCap, Users, BookUser, Shield, Loader2, Check,
  Calendar, Phone, ArrowLeft, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { cn } from "@/lib/utils";

type Role = "student" | "parent" | "teacher";

const roles: { value: Role; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { value: "student", label: "Student", desc: "Learn smarter", icon: GraduationCap },
  { value: "parent", label: "Parent", desc: "Track your child", icon: Users },
  { value: "teacher", label: "Teacher", desc: "Run classrooms", icon: BookUser },
];

const inMobile = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile");
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

const simpleSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: passwordSchema,
});

const studentStep1 = z.object({
  student_full_name: z.string().trim().min(2, "Enter student's full name").max(100),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => {
      const d = new Date(v);
      if (isNaN(d.getTime())) return false;
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 10 && age <= 18;
    }, "Student must be 10–18 years old"),
  student_email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
  student_phone: z.union([z.literal(""), inMobile]).optional(),
});

const studentStep2 = z.object({
  parent_full_name: z.string().trim().min(2, "Enter parent's full name").max(100),
  parent_email: z.string().trim().email("Enter a valid email"),
  parent_mobile: z.union([z.literal(""), inMobile]).optional(),
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
  return s;
}

function SignupPage() {
  const [role, setRole] = useState<Role>("student");

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        role === "student"
          ? "Students aged 10–18 require a parent's email & consent."
          : "Join thousands of educators and families on Smart Lab Online."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-5">
        <div className="mb-2 text-xs font-medium">I am a…</div>
        <div className="grid grid-cols-3 gap-2">
          {roles.map((r) => {
            const active = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
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

      {role === "student" ? (
        <StudentWizard />
      ) : (
        <SimpleSignup role={role} />
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next="/onboarding" />
    </AuthShell>
  );
}

/* ------------------------------- Simple flow (parent / teacher) ------------------------------- */

function SimpleSignup({ role }: { role: Role }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!agree) return toast.error("Please accept the terms to continue.");
    const parsed = simpleSchema.safeParse(form);
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
        data: {
          full_name: parsed.data.full_name,
          role,
          terms_accepted: true,
          privacy_accepted: true,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    nav({ to: "/onboarding" });
  };

  const s = strength(form.password);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][s];

  return (
    <form onSubmit={submit} className="space-y-5">
      <AuthField
        label="Full name" required icon={<User className="h-4 w-4" />}
        value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        error={errors.full_name} placeholder="Aanya Sharma" autoComplete="name"
      />
      <AuthField
        label="Email" type="email" required icon={<Mail className="h-4 w-4" />}
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email} placeholder="you@school.com" autoComplete="email"
      />
      <div>
        <AuthField
          label="Password" type="password" required icon={<Lock className="h-4 w-4" />}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password} placeholder="Min 8 chars, 1 number, 1 uppercase"
          autoComplete="new-password"
        />
        {form.password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn(
                  "flex-1 rounded-full",
                  i < s ? (s >= 3 ? "bg-emerald-500" : s === 2 ? "bg-amber-500" : "bg-rose-500") : "bg-muted",
                )} />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">{strengthLabel}</span>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input" />
        I agree to the <Link to="/" className="text-primary hover:underline">Terms</Link> and{" "}
        <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>.
      </label>

      <button type="submit" disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

/* ------------------------------- Student wizard (10–18, India) ------------------------------- */

type StudentState = {
  student_full_name: string;
  date_of_birth: string;
  student_email: string;
  student_phone: string;
  parent_full_name: string;
  parent_email: string;
  parent_mobile: string;
  password: string;
};

function StudentWizard() {
  const nav = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<StudentState>({
    student_full_name: "", date_of_birth: "",
    student_email: "", student_phone: "",
    parent_full_name: "", parent_email: "", parent_mobile: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [consentParent, setConsentParent] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);

  const set = <K extends keyof StudentState>(k: K, v: StudentState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const nextFrom1 = () => {
    const parsed = studentStep1.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const nextFrom2 = () => {
    const parsed = studentStep2.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setErrors({});
    setStep(3);
  };

  const submit = async () => {
    if (!consentParent || !consentTerms || !consentPrivacy) {
      toast.error("Please accept all consents to continue.");
      return;
    }
    const pw = passwordSchema.safeParse(form.password);
    if (!pw.success) {
      setErrors({ password: pw.error.issues[0].message });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.parent_email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: {
          role: "student",
          full_name: form.student_full_name,
          student_full_name: form.student_full_name,
          student_email: form.student_email || null,
          student_phone: form.student_phone || null,
          date_of_birth: form.date_of_birth,
          parent_full_name: form.parent_full_name,
          parent_email: form.parent_email,
          parent_mobile: form.parent_mobile || null,
          parent_consent: true,
          terms_accepted: true,
          privacy_accepted: true,
          consent_user_agent: navigator.userAgent,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    nav({ to: "/onboarding" });
  };

  const s = strength(form.password);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][s];

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-[11px] font-medium">
        {[
          { n: 1, label: "Student" },
          { n: 2, label: "Parent" },
          { n: 3, label: "Consent" },
        ].map((it, i) => (
          <li key={it.n} className="flex flex-1 items-center gap-2">
            <span className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
              step >= it.n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-muted text-muted-foreground",
            )}>
              {step > it.n ? <Check className="h-3 w-3" /> : it.n}
            </span>
            <span className={cn(step >= it.n ? "text-foreground" : "text-muted-foreground")}>
              {it.label}
            </span>
            {i < 2 && <span className="ml-1 h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-5">
          <AuthField
            label="Student's full name" required icon={<User className="h-4 w-4" />}
            value={form.student_full_name}
            onChange={(e) => set("student_full_name", e.target.value)}
            error={errors.student_full_name} placeholder="Aanya Sharma" autoComplete="name"
          />
          <AuthField
            label="Date of birth" type="date" required icon={<Calendar className="h-4 w-4" />}
            value={form.date_of_birth}
            onChange={(e) => set("date_of_birth", e.target.value)}
            error={errors.date_of_birth}
            max={new Date().toISOString().split("T")[0]}
            hint="Students must be 10–18 years old"
          />
          <AuthField
            label="Student's email (optional)" type="email" icon={<Mail className="h-4 w-4" />}
            value={form.student_email}
            onChange={(e) => set("student_email", e.target.value)}
            error={errors.student_email} placeholder="student@school.com" autoComplete="off"
          />
          <AuthField
            label="Student's phone (optional)" inputMode="numeric" icon={<Phone className="h-4 w-4" />}
            value={form.student_phone}
            onChange={(e) => set("student_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={errors.student_phone} placeholder="10-digit Indian mobile"
          />
          <button type="button" onClick={nextFrom1}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <AuthField
            label="Parent's / Guardian's full name" required icon={<User className="h-4 w-4" />}
            value={form.parent_full_name}
            onChange={(e) => set("parent_full_name", e.target.value)}
            error={errors.parent_full_name} placeholder="Mr. Rohit Sharma" autoComplete="name"
          />
          <AuthField
            label="Parent's email" type="email" required icon={<Mail className="h-4 w-4" />}
            value={form.parent_email}
            onChange={(e) => set("parent_email", e.target.value)}
            error={errors.parent_email} placeholder="parent@example.com" autoComplete="email"
            hint="We'll email a 6-digit code here to verify the parent. Account login uses this email."
          />
          <AuthField
            label="Parent's mobile (optional)" inputMode="numeric" icon={<Phone className="h-4 w-4" />}
            value={form.parent_mobile}
            onChange={(e) => set("parent_mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={errors.parent_mobile} placeholder="10-digit Indian mobile"
            hint="For school communications. SMS verification coming soon."
          />

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={nextFrom2}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <AuthField
              label="Set account password" type="password" required icon={<Lock className="h-4 w-4" />}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              error={errors.password} placeholder="Min 8 chars, 1 number, 1 uppercase"
              autoComplete="new-password"
              hint="The parent will use this password to sign in"
            />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={cn(
                      "flex-1 rounded-full",
                      i < s ? (s >= 3 ? "bg-emerald-500" : s === 2 ? "bg-amber-500" : "bg-rose-500") : "bg-muted",
                    )} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{strengthLabel}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-input bg-muted/30 p-4">
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consentParent}
                onChange={(e) => setConsentParent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input" />
              <span>
                I confirm I am the <strong>parent or legal guardian</strong> of{" "}
                <strong>{form.student_full_name || "the student"}</strong> and I consent to the
                creation of this account on their behalf.
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input" />
              <span>
                I accept the{" "}
                <Link to="/" className="text-primary hover:underline">Terms of Service</Link>.
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input" />
              <span>
                I accept the{" "}
                <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>{" "}
                and consent to processing my child's data in accordance with the
                Digital Personal Data Protection Act 2023.
              </span>
            </label>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={submit} disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
