import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Download, FileSpreadsheet, FileText, Users, BookOpen, GraduationCap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

const reports = [
  { icon: Users,         title: "Student engagement",  desc: "DAU/WAU/MAU, time-on-platform, retention cohorts.", freq: "Weekly",  fmt: "CSV / PDF" },
  { icon: BookOpen,      title: "Content performance", desc: "Top chapters, weakest topics, completion funnels.",  freq: "Weekly",  fmt: "CSV" },
  { icon: GraduationCap, title: "Teacher activity",    desc: "Doubt replies, content edits, class participation.",  freq: "Monthly", fmt: "PDF" },
  { icon: FileBarChart,  title: "Assessment summary",  desc: "Test attempts, scores, mastery distribution.",        freq: "Weekly",  fmt: "CSV / PDF" },
  { icon: CreditCard,    title: "Revenue & billing",   desc: "MRR, churn, dunning, plan distribution.",             freq: "Monthly", fmt: "CSV / PDF" },
  { icon: FileText,      title: "Compliance audit",    desc: "Data access logs, consent records, GDPR exports.",    freq: "On demand", fmt: "PDF" },
];

function AdminReports() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate, schedule, and download platform reports.</p>
        </div>
        <Button variant="outline"><FileSpreadsheet className="size-4" /> Schedule new report</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.title} className="hover-lift flex flex-col rounded-2xl border bg-card p-5 elev-2">
            <div className="bg-primary/10 text-primary mb-3 inline-flex size-9 items-center justify-center rounded-lg">
              <r.icon className="size-4" />
            </div>
            <h3 className="font-display text-sm font-semibold">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline">{r.freq}</Badge>
              <Badge variant="outline" className="text-muted-foreground">{r.fmt}</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1"><Download className="size-3.5" /> Download</Button>
              <Button size="sm" variant="ghost">Configure</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
