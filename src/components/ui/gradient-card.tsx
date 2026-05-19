import { cn } from "@/lib/utils";

/**
 * GradientCard — premium glassmorphic surface with subtle brand gradient.
 * Used for hero highlights, feature spotlights, AI nudge cards.
 */
interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "brand" | "soft" | "ink";
  interactive?: boolean;
}

export function GradientCard({
  tone = "brand",
  interactive = false,
  className,
  children,
  ...rest
}: GradientCardProps) {
  const toneClass =
    tone === "brand"
      ? "bg-gradient-brand text-primary-foreground"
      : tone === "ink"
        ? "bg-[var(--ink)] text-[var(--snow)]"
        : "bg-gradient-soft text-foreground";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 p-6 shadow-elegant transition-soft",
        toneClass,
        interactive && "hover:-translate-y-0.5 hover:shadow-glow",
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 200px at 0% 0%, oklch(1 0 0 / 0.18), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
