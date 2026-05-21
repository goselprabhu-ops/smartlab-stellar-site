import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { User, Loader2, ArrowLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { forgotPasswordByUsername } from "@/lib/account.functions";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";

const schema = z.object({
  identifier: z.string().trim().min(3, "Enter your username or email").max(255),
});

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const nav = useNavigate();
  const reset = useServerFn(forgotPasswordByUsername);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({ identifier });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    try {
      await reset({ data: parsed.data });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? "If an account exists, we've sent a reset link to the parent email on file. It expires in 60 minutes."
          : "Enter your username or email. We'll send a reset link to the parent email on file."
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3">
          <button
            onClick={() => nav({ to: "/login" })}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Back to sign in
          </button>
          <button
            onClick={() => setSent(false)}
            className="w-full rounded-lg border border-input px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Try another username
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthField
            label="Username or email"
            required
            icon={<User className="h-4 w-4" />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={error}
            placeholder="aanya.sharma"
            autoComplete="username"
          />
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot your username?{" "}
            <Link to="/forgot-username" className="text-primary hover:underline">
              Recover it here
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
