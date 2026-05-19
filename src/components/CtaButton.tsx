import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface CtaButtonProps {
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

const SMART_LAB_URL = "https://smartlabonline.app";

export function CtaButton({
  href = SMART_LAB_URL,
  variant = "primary",
  size = "lg",
  children,
  className,
  external = true,
}: CtaButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const sizes = {
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-gradient-gold text-gold-foreground shadow-gold hover:-translate-y-0.5 hover:shadow-elegant",
    secondary:
      "border border-accent/40 bg-transparent text-foreground hover:border-accent hover:bg-accent/10",
    ghost:
      "text-foreground hover:text-accent",
  };

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}
