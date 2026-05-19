import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, MessageCircle, Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { submitContact } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SmartLab Online" },
      {
        name: "description",
        content:
          "Talk to SmartLab Online. Email support@smartlabonline.com or message us on WhatsApp. Bulk pricing available for schools and tuitions.",
      },
      { property: "og:title", content: "Contact — SmartLab Online" },
      {
        property: "og:description",
        content:
          "Reach out about plans, demos, school partnerships, or bulk pricing.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const GRADES = [
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
  { value: "parent", label: "I'm a parent" },
  { value: "school", label: "School / tuition" },
];

function ContactPage() {
  const submit = useServerFn(submitContact);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      toast.error("Please choose a grade or category.");
      return;
    }
    setLoading(true);
    try {
      await submit({
        data: {
          name: name.trim(),
          email: email.trim(),
          grade,
          message: message.trim(),
        },
      });
      toast.success("Thanks! We'll get back to you within 1 business day.");
      setName("");
      setEmail("");
      setGrade("");
      setMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Contact"
            title="Let's talk."
            description="Questions about plans, demos, school partnerships, or bulk pricing — we'd love to hear from you."
            as="h1"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="lg:col-span-3 rounded-3xl border border-border bg-card p-8 sm:p-10"
          >
            <h2 className="font-display text-2xl font-semibold tracking-tight">Send a message</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We typically respond within 1 business day.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="name">
                <input
                  id="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="you@example.com"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Grade / category" htmlFor="grade">
                <select
                  id="grade"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                >
                  <option value="" disabled>Choose one…</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Message" htmlFor="message">
                <textarea
                  id="message"
                  required
                  minLength={10}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="Tell us a bit about what you're looking for…"
                />
                <p className="mt-1 text-xs text-muted-foreground">{message.length}/1000</p>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold px-7 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all hover:-translate-y-0.5 hover:shadow-elegant disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>

          {/* Contact info */}
          <aside className="lg:col-span-2">
            <div className="rounded-3xl bg-gradient-hero p-8 text-cream shadow-elegant sm:p-10">
              <h2 className="font-display text-xl font-semibold">Reach us directly</h2>
              <p className="mt-2 text-sm text-cream/70">
                Prefer email or WhatsApp? Pick whichever's easier.
              </p>

              <div className="mt-8 space-y-5">
                <a
                  href="mailto:support@smartlabonline.com"
                  className="group flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/5 p-4 transition-colors hover:border-accent/40"
                >
                  <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-cream/50">Email</div>
                    <div className="mt-0.5 text-sm font-medium text-cream group-hover:text-accent">
                      support@smartlabonline.com
                    </div>
                  </div>
                </a>

                <a
                  href="https://wa.me/919000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/5 p-4 transition-colors hover:border-accent/40"
                >
                  <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-cream/50">WhatsApp</div>
                    <div className="mt-0.5 text-sm font-medium text-cream group-hover:text-accent">
                      +91 9XXXXXXXXX
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-10 border-t border-cream/10 pt-6 text-xs text-cream/50">
                Schools & tuition centres — ask us about bulk pricing.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
