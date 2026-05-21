import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, Sparkles, ShieldCheck, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { getStudyAccess, startTrial } from "@/lib/study-access.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subscribe")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  head: () => ({
    meta: [
      { title: "Choose your plan — Smart Lab Online" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubscribePage,
});

const PLANS = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "₹499",
    period: "/ month",
    note: "Billed every month after the trial. Cancel anytime.",
    perks: ["Full curriculum access", "AI tutor", "Adaptive practice", "Parent insights"],
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "₹4,799",
    period: "/ year",
    note: "Save 20% vs monthly. Billed yearly after the trial.",
    perks: ["Everything in Monthly", "Save ~₹1,200/yr", "Priority support", "Early access to new modules"],
    highlight: true,
  },
];

function SubscribePage() {
  const nav = useNavigate();
  const fetchAccess = useServerFn(getStudyAccess);
  const trial = useServerFn(startTrial);
  const [pending, setPending] = useState<"monthly" | "yearly" | null>(null);

  const access = useQuery({ queryKey: ["study-access"], queryFn: () => fetchAccess() });

  const choose = async (plan: "monthly" | "yearly") => {
    setPending(plan);
    try {
      await trial({ data: { plan } });
      toast.success(`Your 14-day free trial has started`);
      nav({ to: "/onboarding" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(null);
    }
  };

  const alreadyTrialed = access.data?.status && access.data.status !== "none";

  return (
    <AuthShell
      title="Pick a plan and start your 14-day free trial"
      subtitle="No card required. Cancel anytime during the trial."
    >
      <div className="space-y-4">
        {access.data?.hasAccess && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <div className="font-semibold text-primary">You already have access</div>
            <p className="mt-1 text-muted-foreground">
              {access.data.status === "trialing" && access.data.trialEndsAt
                ? `Trial ends ${new Date(access.data.trialEndsAt).toLocaleDateString()}.`
                : "Your subscription is active."}
            </p>
            <button
              onClick={() => nav({ to: access.data.onboarded ? "/student/study-path" : "/onboarding" })}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {access.data.onboarded ? "Go to study path" : "Continue to onboarding"}
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending !== null || (alreadyTrialed && !access.data?.hasAccess)}
              onClick={() => choose(p.id)}
              className={cn(
                "group relative rounded-2xl border p-5 text-left transition-soft hover:border-primary disabled:cursor-not-allowed disabled:opacity-60",
                p.highlight ? "border-primary bg-primary/5" : "border-input bg-card",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Best value
                </span>
              )}
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-1">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="ml-1 text-xs text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-1.5 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">{p.note}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground group-hover:opacity-95">
                {pending === p.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                Start 14-day free trial
              </div>
            </button>
          ))}
        </div>

        {alreadyTrialed && !access.data?.hasAccess && (
          <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-3 text-xs">
            <div className="font-semibold">Free trial already used</div>
            <p className="mt-1 text-muted-foreground">
              Your free trial has ended. Paid checkout is coming soon — please email{" "}
              <a className="text-primary underline" href="mailto:support@smartlabonline.com">
                support@smartlabonline.com
              </a>{" "}
              to continue.
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
          During the 14-day trial you get full access. We'll remind you 3 days before it ends.
        </div>
      </div>
    </AuthShell>
  );
}
