import { Link } from "@tanstack/react-router";
import { Sparkles, Brain, LineChart, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const highlights = [
  { icon: Brain, title: "AI Tutor that adapts", desc: "Socratic guidance tuned to each student." },
  { icon: LineChart, title: "Mastery you can see", desc: "Concept-level progress, not vanity scores." },
  { icon: Sparkles, title: "Smart Study Path", desc: "A daily plan that learns as the student learns." },
  { icon: ShieldCheck, title: "Trusted by parents & schools", desc: "Private, secure, and built for CBSE 6–12." },
];

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-brand lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-hero opacity-60" aria-hidden />
        <div className="relative inline-flex items-center gap-3">
          <Logo />
          <span className="font-display text-lg font-semibold">Smart Lab Online</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight">
              Learning that thinks <br /> with the student.
            </h2>
            <p className="mt-3 max-w-md text-sm text-primary-foreground/85">
              Premium AI tools for CBSE Classes 6–12 — built with teachers, loved by parents.
            </p>
          </div>

          <ul className="grid max-w-md gap-4">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/15">
                <span className="rounded-lg bg-white/20 p-2">
                  <h.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium">{h.title}</div>
                  <div className="text-xs text-primary-foreground/80">{h.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/75">
          © {new Date().getFullYear()} Smart Lab Online · Privacy-first by design
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-base font-semibold">Smart Lab</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
