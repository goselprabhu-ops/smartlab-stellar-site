import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "",
    role: "student" as "student" | "parent",
    grade: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: form.full_name, role: form.role, grade: form.grade },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    nav({ to: "/dashboard" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Start your Smart Lab journey.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input required maxLength={100} placeholder="Full name" value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <input required type="password" minLength={8} placeholder="Password (min 8)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "student" | "parent" })}
            className="rounded-lg border border-input bg-background px-4 py-3 text-sm">
            <option value="student">I'm a student</option>
            <option value="parent">I'm a parent</option>
          </select>
          <input maxLength={20} placeholder="Grade (6–12)" value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <button onClick={google} className="mt-3 w-full rounded-lg border border-input px-4 py-3 text-sm font-medium hover:bg-muted">
        Continue with Google
      </button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
