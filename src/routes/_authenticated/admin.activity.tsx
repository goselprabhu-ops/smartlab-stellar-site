import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Search, LogIn, Pencil, Trash2, ShieldCheck, Upload, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivity,
});

type Entry = { id: string; actor: string; role: string; action: string; target: string; ip: string; at: string; icon: typeof Activity };

const entries: Entry[] = [
  { id: "a1", actor: "admin@smartlab.in",  role: "admin",   action: "Published chapter",    target: "Physics · Class 11 · Kinematics", ip: "10.0.1.4",  at: "2m ago",  icon: Upload },
  { id: "a2", actor: "anita.sharma",       role: "teacher", action: "Edited lesson",        target: "Maths · Quadratic equations",      ip: "10.0.2.18", at: "14m ago", icon: Pencil },
  { id: "a3", actor: "admin@smartlab.in",  role: "admin",   action: "Granted role",         target: "rohan.mehta → teacher",            ip: "10.0.1.4",  at: "1h ago",  icon: ShieldCheck },
  { id: "a4", actor: "system",             role: "system",  action: "API key rotated",      target: "LOVABLE_API_KEY",                  ip: "—",         at: "3h ago",  icon: KeyRound },
  { id: "a5", actor: "neha.kapoor",        role: "teacher", action: "Deleted quiz",         target: "English · Grammar drill #4",       ip: "10.0.2.31", at: "5h ago",  icon: Trash2 },
  { id: "a6", actor: "aarav.singh",        role: "student", action: "Logged in",            target: "Web · Chrome",                     ip: "182.74.x.x",at: "6h ago",  icon: LogIn },
  { id: "a7", actor: "admin@smartlab.in",  role: "admin",   action: "Updated pricing plan", target: "Pro Annual → ₹2399",              ip: "10.0.1.4",  at: "1d ago",  icon: Pencil },
];

const roleStyle: Record<string, string> = {
  admin:   "border-primary/30 bg-primary/10 text-primary",
  teacher: "border-info/30 bg-info/15 text-info",
  student: "border-success/30 bg-success/15 text-success",
  system:  "border-muted-foreground/30 bg-muted text-muted-foreground",
};

function AdminActivity() {
  const [q, setQ] = useState("");
  const filtered = entries.filter((e) =>
    [e.actor, e.action, e.target].some((s) => s.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Activity logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Audit trail of admin, teacher, and system actions across the platform.</p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, action, target…" className="w-72 pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <ul className="divide-y">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-start gap-4 p-4 hover:bg-muted/30">
              <div className="bg-primary/10 text-primary mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
                <e.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{e.actor}</span>
                  <Badge variant="outline" className={roleStyle[e.role]}>{e.role}</Badge>
                  <span className="text-muted-foreground">{e.action}</span>
                  <span className="font-medium">{e.target}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-mono">IP {e.ip} · {e.at}</div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No activity matches.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
