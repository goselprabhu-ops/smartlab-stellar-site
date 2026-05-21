import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { forgotUsername } from "@/lib/account.functions";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";

const schema = z.object({ parent_email: z.string().trim().email("Enter a valid email") });

export const Route = createFileRoute("/forgot-username")({
  head: () => ({
    meta: [
      { title: "Forgot username — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotUsernamePage,
});

function ForgotUsernamePage() {
  const recover = useServerFn(forgotUsername);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({ parent_email: email });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    try {
      await recover({ data: parsed.data });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your email" : "Forgot your username?"}
      subtitle={
        sent
          ? `If an account exists for ${email}, we've sent the username(s) to that address.`
          : "Enter the parent email registered with the account and we'll email the username."
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Link
          to="/login"
          className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          Back to sign in
        </Link>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthField
            label="Parent email"
            type="email"
            required
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="parent@example.com"
            autoComplete="email"
          />
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending…" : "Email me my username"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
