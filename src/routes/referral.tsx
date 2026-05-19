import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Trophy, Sparkles, Copy, Check, ArrowRight, Users } from "lucide-react";

import { getOrCreateMyReferralCode } from "@/lib/launch.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "Refer & Earn — Smart Lab Online" },
      {
        name: "description",
        content:
          "Share Smart Lab Online with friends. Skip the waitlist, unlock launch perks, and earn free Pro months for every signup.",
      },
    ],
  }),
  component: ReferralPage,
});

const TIERS = [
  { count: 1, reward: "Founder badge + bonus AI credits" },
  { count: 3, reward: "1 month free Pro" },
  { count: 10, reward: "3 months free Pro + private onboarding" },
  { count: 25, reward: "Lifetime Pro + featured in launch story" },
];

function ReferralPage() {
  const auth = useAuth();
  const fetchCode = useServerFn(getOrCreateMyReferralCode);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (auth.user) {
      fetchCode({ data: undefined as never })
        .then((r) => setCode(r.code))
        .catch(() => null);
    }
  }, [auth.user, fetchCode]);

  const link =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/launch?ref=${code}`
      : code
        ? `/launch?ref=${code}`
        : null;

  return (
    <main className="container mx-auto max-w-5xl space-y-16 px-6 py-20">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Gift className="size-3.5 text-primary" /> Refer & earn
        </div>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          Share Smart Lab. Climb the waitlist.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Every friend who joins through your link bumps you up and unlocks rewards — from founder badges to lifetime Pro.
        </p>
      </header>

      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 elev-2">
        {auth.user ? (
          code && link ? (
            <div className="space-y-4">
              <p className="font-display text-lg font-medium">Your personal referral link</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={link} className="font-mono text-xs" />
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Try Smart Lab Online with me: ${link}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">Share on WhatsApp</Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Code: <span className="font-mono">{code}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Generating your referral link…</p>
          )
        ) : (
          <div className="space-y-3 text-center">
            <Sparkles className="mx-auto size-6 text-primary" />
            <p className="font-display text-lg font-medium">Sign in to get your referral link</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/login">
                <Button>Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline">Create account</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">Reward tiers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.count} className="rounded-2xl border bg-card p-6 elev-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Trophy className="size-5" />
                </span>
                <p className="font-display text-lg font-semibold">
                  {t.count} friend{t.count > 1 ? "s" : ""}
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t.reward}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-8 text-center elev-1">
        <Users className="mx-auto size-6 text-primary" />
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          Not on the waitlist yet?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Join 12,000+ early learners and get launch-day perks before the public release.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/launch">
            <Button size="lg" className="rounded-full">
              Join the waitlist <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <WhatsAppButton />
        </div>
      </section>
    </main>
  );
}
