import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)}
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {c.to && !isLast ? (
              <Link
                to={c.to}
                className="transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={cn(isLast && "font-medium text-foreground")}
              >
                {c.label}
              </span>
            )}
            {!isLast ? <ChevronRight className="h-3.5 w-3.5 opacity-60" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
