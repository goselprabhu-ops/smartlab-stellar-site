import { cn } from "@/lib/utils";

/**
 * KpiTile — vivid KPI tile with optional accent bar. Used in hero metric
 * strips and the student dashboard summary row.
 */
interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
  icon?: React.ReactNode;
  className?: string;
}

const ACCENT_MAP: Record<NonNullable<KpiTileProps["accent"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function KpiTile({
  label,
  value,
  caption,
  accent = "primary",
  icon,
  className,
}: KpiTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-soft hover:shadow-elegant",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 h-full w-1", ACCENT_MAP[accent])}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {value}
          </p>
          {caption && (
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-primary",
              accent === "primary" && "bg-primary/10",
              accent === "accent" && "bg-accent/15 text-accent-foreground",
              accent === "success" && "bg-success/10 text-success",
              accent === "warning" && "bg-warning/15 text-warning-foreground",
              accent === "destructive" && "bg-destructive/10 text-destructive",
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
