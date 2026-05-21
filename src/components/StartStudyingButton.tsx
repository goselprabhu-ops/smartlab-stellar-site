import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { getStudyAccess } from "@/lib/study-access.functions";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  label?: string;
}

export function StartStudyingButton({ className, label = "Start studying" }: Props) {
  const nav = useNavigate();
  const fetchAccess = useServerFn(getStudyAccess);
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    try {
      const a = await fetchAccess();
      if (a.nextStep === "subscribe") nav({ to: "/subscribe" });
      else if (a.nextStep === "onboarding") nav({ to: "/onboarding" });
      else nav({ to: "/student/study-path" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-soft hover:opacity-95 disabled:opacity-60",
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </button>
  );
}
