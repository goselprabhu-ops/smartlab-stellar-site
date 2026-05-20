import { Link } from "@tanstack/react-router";
import { Clock, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MicroLessonCard({
  title, subject, minutes, reason, to,
}: {
  title: string; subject?: string; minutes?: number; reason?: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border bg-card p-4 elev-1 transition-soft hover:elev-2 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {subject && (
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {subject}
            </div>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
          {reason && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline size-3 text-primary" />
              {reason}
            </p>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" /> {minutes ?? 4} min
        </span>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Start</Button>
      </div>
    </Link>
  );
}
