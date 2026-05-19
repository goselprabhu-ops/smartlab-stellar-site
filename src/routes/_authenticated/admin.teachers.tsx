import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Search, UserPlus, ShieldCheck, BookOpen, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  component: AdminTeachers,
});

const seed = [
  { id: "t1", name: "Anita Sharma",  subject: "Mathematics", classes: "9–12", students: 142, status: "active"  },
  { id: "t2", name: "Rohan Mehta",   subject: "Physics",     classes: "11–12", students: 88,  status: "active"  },
  { id: "t3", name: "Priya Iyer",    subject: "Chemistry",   classes: "9–10",  students: 110, status: "pending" },
  { id: "t4", name: "Vikram Singh",  subject: "Biology",     classes: "11–12", students: 76,  status: "active"  },
  { id: "t5", name: "Neha Kapoor",   subject: "English",     classes: "6–8",   students: 134, status: "inactive"},
];

const kpis = [
  { icon: GraduationCap, label: "Teachers",       value: "48",   hint: "12 active today" },
  { icon: BookOpen,      label: "Avg classes",    value: "3.4",  hint: "per teacher" },
  { icon: MessageSquare, label: "Replies (7d)",   value: "412",  hint: "doubt-solving" },
  { icon: ShieldCheck,   label: "Pending review", value: "3",    hint: "new sign-ups" },
];

function AdminTeachers() {
  const [q, setQ] = useState("");
  const filtered = seed.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Teacher management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Onboard, assign subjects, and monitor teacher activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teachers…" className="w-64 pl-9" />
          </div>
          <Button><UserPlus className="size-4" /> Invite teacher</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <k.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
            <div className="font-display text-3xl font-semibold">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Teacher</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Classes</th>
              <th className="p-3 text-right">Students</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-muted-foreground">{t.subject}</td>
                <td className="p-3 text-muted-foreground">{t.classes}</td>
                <td className="p-3 text-right font-mono">{t.students}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={
                      t.status === "active"
                        ? "border-success/30 bg-success/15 text-success"
                        : t.status === "pending"
                          ? "border-warning/30 bg-warning/15 text-warning"
                          : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }
                  >
                    {t.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No teachers match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
