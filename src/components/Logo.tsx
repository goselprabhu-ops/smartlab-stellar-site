import { Link } from "@tanstack/react-router";

interface LogoProps {
  variant?: "light" | "dark";
}

export function Logo({ variant = "dark" }: LogoProps) {
  const text = variant === "light" ? "text-cream" : "text-foreground";
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="relative flex h-9 w-9 items-center justify-center rounded-md bg-gradient-gold text-gold-foreground shadow-gold"
      >
        <span className="font-display text-base font-bold leading-none">SL</span>
      </span>
      <span className={`font-display text-lg font-semibold tracking-tight ${text}`}>
        SmartLab
        <span className="text-accent"> Online</span>
      </span>
    </Link>
  );
}
