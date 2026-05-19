import { useEffect, useState } from "react";

interface CountdownProps {
  target: string | Date | null | undefined;
  className?: string;
}

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, done: ms === 0 };
}

export function Countdown({ target, className }: CountdownProps) {
  const date = target ? new Date(target) : null;
  const [t, setT] = useState(() => (date ? diff(date) : null));

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [date?.getTime()]);

  if (!date || !t) {
    return <p className="text-sm text-muted-foreground">Launch date coming soon.</p>;
  }

  const units: Array<[string, number]> = [
    ["Days", t.d],
    ["Hours", t.h],
    ["Minutes", t.m],
    ["Seconds", t.s],
  ];

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-4 ${className ?? ""}`}>
      {units.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border bg-card/80 px-3 py-4 text-center elev-1 backdrop-blur"
        >
          <div className="font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
