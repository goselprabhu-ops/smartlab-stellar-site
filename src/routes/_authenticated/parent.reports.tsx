import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/parent/reports")({
  head: () => ({ meta: [{ title: "Reports — Parent · Smart Lab Online" }] }),
  component: ReportsPage,
});

const reports = [
  { title: "Weekly digest · Riya · Week 19", date: "May 18, 2026", kind: "Weekly", status: "Ready" },
  { title: "Monthly report · Riya · April",   date: "May 1, 2026",  kind: "Monthly", status: "Ready" },
  { title: "Term 1 mastery summary · Riya",   date: "Mar 31, 2026", kind: "Term", status: "Ready" },
  { title: "PTM brief · Riya",                 date: "Mar 12, 2026", kind: "PTM", status: "Archived" },
];

function ReportsPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Generated reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">Auto-generated every week. Download or email to your child's teacher.</p>
        </div>
        <Button variant="outline"><Mail className="size-4" /> Email me weekly</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Report</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.title} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-primary size-4" />
                    {r.title}
                  </div>
                </td>
                <td className="p-3"><Badge variant="outline">{r.kind}</Badge></td>
                <td className="p-3 text-muted-foreground">{r.date}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm"><Download className="size-4" /> PDF</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
