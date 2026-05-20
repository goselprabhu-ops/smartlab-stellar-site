import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export type MobileTab = { to: string; label: string; icon: LucideIcon };

export function MobileShell({
  title, tabs, children, right,
}: { title: string; tabs: MobileTab[]; children: ReactNode; right?: ReactNode }) {
  const loc = useLocation();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-4rem)] flex-col bg-background sm:-mx-6 lg:-mx-10 lg:-my-8">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-display truncate text-base font-semibold">{title}</h1>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              online ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700",
            )}
            aria-label={online ? "Online" : "Offline"}
          >
            {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
            {online ? "Live" : "Offline"}
          </span>
        </div>
        <div className="shrink-0">{right}</div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map((t) => {
            const active = loc.pathname === t.to || loc.pathname.startsWith(t.to + "/");
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-soft",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="size-5" />
                  <span>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
