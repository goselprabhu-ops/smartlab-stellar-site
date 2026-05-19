import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export function GoogleButton({ label = "Continue with Google", next = "/dashboard" }: { label?: string; next?: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + next,
      });
      if (r.error) toast.error(r.error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium transition-soft hover:bg-muted disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.4 35.5 12 30.1 12 23.5S17.4 11.5 24 11.5c3.1 0 5.9 1.1 8 3l5.7-5.7C34.1 5.4 29.3 3.5 24 3.5 12.9 3.5 4 12.4 4 23.5s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.1 6.9 29.3 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.5-5.2l-6.2-5.1C29.3 34 26.8 35 24 35c-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 38.5 16.3 43 24 43z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.5 5.7l6.2 5.1C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.5-.4-3.5z"/>
      </svg>
      {loading ? "Connecting…" : label}
    </button>
  );
}
