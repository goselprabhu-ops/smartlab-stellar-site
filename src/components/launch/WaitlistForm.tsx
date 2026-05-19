import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { joinWaitlist } from "@/lib/launch.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WaitlistFormProps {
  referredByCode?: string;
  source?: string;
  onJoined?: (info: { referralCode: string; totalSignups: number }) => void;
}

export function WaitlistForm({ referredByCode, source = "landing", onJoined }: WaitlistFormProps) {
  const join = useServerFn(joinWaitlist);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await join({
        data: {
          email: String(fd.get("email") || ""),
          name: String(fd.get("name") || "") || undefined,
          role: (String(fd.get("role") || "student") as "student" | "parent" | "teacher" | "school"),
          grade: String(fd.get("grade") || "") || undefined,
          city: String(fd.get("city") || "") || undefined,
          source,
          referredByCode,
        },
      });
      const code = res.signup?.referral_code ?? "";
      setDone({ code, total: res.totalSignups });
      onJoined?.({ referralCode: code, totalSignups: res.totalSignups });
      toast.success("You're on the list! 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join waitlist");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const link = typeof window !== "undefined" ? `${window.location.origin}/launch?ref=${done.code}` : `/launch?ref=${done.code}`;
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-6 elev-1">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <p className="font-display text-lg font-medium">You're #{done.total} on the waitlist</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Move up the queue — share your referral link. Every friend who joins bumps you up and unlocks rewards.
        </p>
        <div className="flex items-center gap-2">
          <Input readOnly value={link} className="font-mono text-xs" />
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-6 elev-1">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wl-name">Full name</Label>
          <Input id="wl-name" name="name" placeholder="Aarav Sharma" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-email">Email</Label>
          <Input id="wl-email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-role">I am a</Label>
          <Select name="role" defaultValue="student">
            <SelectTrigger id="wl-role"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="school">School / Institute</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-grade">Class</Label>
          <Select name="grade" defaultValue="10">
            <SelectTrigger id="wl-grade"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wl-city">City (optional)</Label>
          <Input id="wl-city" name="city" placeholder="Bengaluru" />
        </div>
      </div>
      {referredByCode ? (
        <p className="text-xs text-muted-foreground">
          Referred by <span className="font-mono text-foreground">{referredByCode}</span> — both of you unlock launch bonuses.
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Join the waitlist
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        No spam. One email when early access opens for you.
      </p>
    </form>
  );
}
