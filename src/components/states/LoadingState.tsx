import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  /** Number of placeholder rows to render. */
  rows?: number;
  /** Show a leading title/description skeleton. */
  withHeader?: boolean;
  className?: string;
}

export function LoadingState({
  rows = 3,
  withHeader = true,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-fade-in space-y-6", className)}
    >
      <span className="sr-only">Loading…</span>
      {withHeader ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : null}
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
