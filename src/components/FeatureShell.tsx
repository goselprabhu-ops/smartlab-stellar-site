import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Smart Lab Online — Feature page shell.
 * Provides a consistent hero + grouped feature grid for IA pages
 * whose deep functionality lands in later phases.
 */

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeatureGroup {
  title: string;
  description?: string;
  items: FeatureItem[];
}

interface FeatureShellProps {
  eyebrow: string;
  title: string;
  description: string;
  status?: "live" | "beta" | "soon";
  groups: FeatureGroup[];
  children?: React.ReactNode;
}

const statusCopy = {
  live: { label: "Live", className: "bg-success/15 text-success border-success/30" },
  beta: { label: "Beta", className: "bg-info/15 text-info border-info/30" },
  soon: { label: "Coming in v1.1", className: "bg-warning/15 text-warning border-warning/30" },
} as const;

export function FeatureShell({
  eyebrow, title, description, status = "live", groups, children,
}: FeatureShellProps) {
  const s = statusCopy[status];
  return (
    <div className="animate-fade-in space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </span>
          <Badge variant="outline" className={s.className}>{s.label}</Badge>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
      </header>

      {children}

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold">{group.title}</h2>
              {group.description && (
                <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((it) => (
                <div
                  key={it.title}
                  className="hover-lift rounded-xl border bg-card p-5 elev-2"
                >
                  <div className="bg-primary/10 text-primary mb-3 inline-flex size-9 items-center justify-center rounded-lg">
                    <it.icon className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{it.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
