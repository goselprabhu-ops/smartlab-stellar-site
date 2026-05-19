import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { scheduleDemo } from "@/lib/launch.functions";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Book a Demo — Smart Lab Online" },
      { name: "description", content: "See Smart Lab Online live. Book a 20-minute walkthrough tailored to your child or school." },
      { property: "og:title", content: "Book a Demo — Smart Lab Online" },
      { property: "og:description", content: "20-minute live walkthrough of the Smart Lab Online platform." },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = useServerFn(scheduleDemo);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await submit({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || "") || undefined,
          role: (String(fd.get("role") || "parent") as "parent" | "student" | "teacher" | "school"),
          grade: String(fd.get("grade") || "") || undefined,
          preferredDate: String(fd.get("preferredDate") || "") || undefined,
          preferredTime: String(fd.get("preferredTime") || "") || undefined,
          notes: String(fd.get("notes") || "") || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Demo request received. We'll reach out within one business day.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Book a demo</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">See Smart Lab live.</h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            A 20-minute walkthrough tailored to your student or institution. We'll show you mastery tracking, the AI tutor, and the adaptive engine — using real CBSE chapters.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              { icon: Clock, label: "20 minutes, no slides — live product" },
              { icon: Calendar, label: "Choose a slot Monday–Saturday, 10am–7pm IST" },
              { icon: Users, label: "Bring your student, co-founder, or principal" },
              { icon: CheckCircle2, label: "Get a 14-day full-access trial after the call" },
            ].map((it) => (
              <li key={it.label} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full">
                  <it.icon className="size-4" />
                </span>
                <span>{it.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border bg-card p-8 elev-4">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="bg-success/15 text-success inline-flex size-14 items-center justify-center rounded-full">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">You're on the list</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                We've received your request. A Smart Lab advisor will email you within one business day with available slots.
              </p>
              <Link to="/" className="text-primary mt-6 text-sm font-medium hover:underline">← Back to home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Tell us a bit about you</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" required placeholder="Riya Sharma" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+91 9XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">I am a</Label>
                  <Select name="role" defaultValue="parent">
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="school">School leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="grade">Student class</Label>
                  <Select name="grade" defaultValue="9">
                    <SelectTrigger id="grade"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferredDate">Preferred date</Label>
                  <Input id="preferredDate" name="preferredDate" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferredTime">Time</Label>
                  <Select name="preferredTime" defaultValue="evening">
                    <SelectTrigger id="preferredTime"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (10–12)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12–4)</SelectItem>
                      <SelectItem value="evening">Evening (4–7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Anything else? (optional)</Label>
                <Textarea id="notes" name="notes" rows={3} placeholder="Subjects of focus, school name, preferred time…" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Request demo
              </Button>
              <div className="flex items-center justify-center gap-3 pt-2">
                <WhatsAppButton label="Prefer WhatsApp?" />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                By submitting, you agree to be contacted by our advisory team.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
