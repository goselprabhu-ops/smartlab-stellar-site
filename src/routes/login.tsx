import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { User, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { resolveLoginIdentity } from "@/lib/account.functions";
import { getStudyAccess } from "@/lib/study-access.functions";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your username or email").max(255),
  password: z.string().min(8, "At least 8 characters"),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  head: () => ({
    meta: [
      { title: "Sign in — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const resolve = useServerFn(resolveLoginIdentity);
  const fetchAccess = useServerFn(getStudyAccess);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      setErrors(map);
      return;
    }
    setLoading(true);
    try {
      const { email } = await resolve({ data: { identifier: parsed.data.identifier } });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      });
      if (error) {
        toast.error("Incorrect username or password");
        return;
      }
      toast.success("Welcome back");
      // First-time sign-in → onboarding; otherwise dashboard / redirect target
      try {
        const access = await fetchAccess();
        if (!access.hasAccess) {
          nav({ to: "/subscribe" });
        } else if (!access.onboarded) {
          nav({ to: "/onboarding" });
        } else {
          nav({ to: redirect });
        }
      } catch {
        nav({ to: redirect });
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your learning."
      footer={
        <>
          New to Smart Lab?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Username or email"
          autoComplete="username"
          required
          icon={<User className="h-4 w-4" />}
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          error={errors.identifier}
          placeholder="aanya.sharma"
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          icon={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between text-xs">
          <Link to="/forgot-username" className="text-primary hover:underline">
            Forgot username?
          </Link>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={redirect} />
    </AuthShell>
  );
}
