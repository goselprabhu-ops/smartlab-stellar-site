import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, Search, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupport,
});

type Ticket = {
  id: string;
  subject: string;
  user: string;
  role: "student" | "parent" | "teacher";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  updated: string;
};

const tickets: Ticket[] = [
  { id: "T-1042", subject: "Cannot access Class 10 Physics chapter",       user: "Aarav Singh",    role: "student", priority: "high",   status: "open",        updated: "12m ago" },
  { id: "T-1041", subject: "Subscription renewal failed",                   user: "Meera Patel",    role: "parent",  priority: "urgent", status: "in_progress", updated: "1h ago"  },
  { id: "T-1040", subject: "AI tutor returning wrong answer for Maths",    user: "Karan Reddy",    role: "student", priority: "medium", status: "open",        updated: "3h ago"  },
  { id: "T-1039", subject: "Bulk upload of student roster",                 user: "Anita Sharma",   role: "teacher", priority: "low",    status: "resolved",    updated: "1d ago"  },
  { id: "T-1038", subject: "Parent dashboard not showing test results",     user: "Sanjay Verma",   role: "parent",  priority: "high",   status: "in_progress", updated: "2d ago"  },
];

const priorityStyle: Record<Ticket["priority"], string> = {
  urgent: "border-destructive/30 bg-destructive/15 text-destructive",
  high:   "border-warning/30 bg-warning/15 text-warning",
  medium: "border-info/30 bg-info/15 text-info",
  low:    "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const statusStyle: Record<Ticket["status"], string> = {
  open:        "border-warning/30 bg-warning/15 text-warning",
  in_progress: "border-info/30 bg-info/15 text-info",
  resolved:    "border-success/30 bg-success/15 text-success",
};

function AdminSupport() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Ticket["status"]>("all");

  const filtered = tickets.filter((t) =>
    (filter === "all" || t.status === filter) &&
    (t.subject.toLowerCase().includes(q.toLowerCase()) || t.user.toLowerCase().includes(q.toLowerCase())),
  );

  const kpis = [
    { icon: LifeBuoy,    label: "Open",        value: tickets.filter((t) => t.status === "open").length },
    { icon: Clock,       label: "In progress", value: tickets.filter((t) => t.status === "in_progress").length },
    { icon: CheckCircle2,label: "Resolved 7d", value: 38 },
    { icon: AlertCircle, label: "SLA risk",    value: 2 },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Support tickets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Triage, assign, and resolve user issues.</p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className="w-64 pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <k.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
            <div className="font-display text-3xl font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 elev-1 w-fit">
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Subject</th>
              <th className="p-3">User</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{t.id}</td>
                <td className="p-3 font-medium">{t.subject}</td>
                <td className="p-3 text-muted-foreground">{t.user} <span className="text-xs">· {t.role}</span></td>
                <td className="p-3"><Badge variant="outline" className={priorityStyle[t.priority]}>{t.priority}</Badge></td>
                <td className="p-3"><Badge variant="outline" className={statusStyle[t.status]}>{t.status.replace("_", " ")}</Badge></td>
                <td className="p-3 text-right text-xs text-muted-foreground">{t.updated}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No tickets match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
