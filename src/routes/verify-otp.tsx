import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (s) => ({ email: (s.email as string) || "" }),
  head: () => ({
    meta: [
      { title: "Verify your email — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const nav = useNavigate();
  const { email } = useSearch({ from: "/verify-otp" });
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(45);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const setDigit = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = Array(6).fill("").map((_, i) => txt[i] ?? "");
    setDigits(next);
    inputs.current[Math.min(txt.length, 5)]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = digits.join("");
    if (token.length !== 6) return toast.error("Enter all 6 digits");
    if (!email) return toast.error("Missing email. Please sign up again.");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Email verified");
    nav({ to: "/onboarding" });
  };

  const resend = async () => {
    if (!email) return toast.error("Missing email");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return toast.error(error.message);
    toast.success("A new code is on its way");
    setResendIn(45);
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        email ? (
          <>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.</>
        ) : (
          "Enter the 6-digit code we sent to your email."
        )
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus();
              }}
              className="h-14 w-12 rounded-lg border border-input bg-background text-center font-display text-2xl font-semibold outline-none transition-soft focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
        <div className="text-center text-xs text-muted-foreground">
          Didn't get it?{" "}
          {resendIn > 0 ? (
            <span>Resend in {resendIn}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-medium text-primary hover:underline">
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
