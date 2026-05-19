import { cn } from "@/lib/utils";

/**
 * StatCard — quiet stat tile for dashboards and marketing proof strips.
 * Pairs an icon, label, value, and optional delta/hint.
 */
interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft transition-soft hover:shadow-elegant",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight">
        {value}
      </div>
      {hint && (
        <div
          className={cn(
            "mt-1.5 text-xs",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            !trend && "text-muted-foreground",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
