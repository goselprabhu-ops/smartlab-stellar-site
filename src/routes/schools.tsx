import { createFileRoute } from "@tanstack/react-router";
import { School, BarChart3, Users, ShieldCheck, BookOpen, FileText } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "For Schools — Smart Lab Online" },
      { name: "description", content: "Smart Lab Online for schools: institution dashboards, teacher tools, class-level analytics, and CBSE-aligned curriculum at scale." },
      { property: "og:title", content: "For Schools — Smart Lab Online" },
      { property: "og:description", content: "Bring adaptive AI learning to every classroom." },
    ],
  }),
  component: SchoolsPage,
});

const offerings = [
  { icon: School, title: "Institution dashboard", description: "One view of every class, section, and grade — with mastery and engagement at a glance." },
  { icon: Users, title: "Teacher accounts", description: "Class management, assignment creation, and per-student insight for educators." },
  { icon: BarChart3, title: "Class analytics", description: "Identify struggling cohorts, top performers, and curriculum gaps in real time." },
  { icon: BookOpen, title: "Aligned to CBSE", description: "Curriculum mapping that follows your school's pacing calendar and exam patterns." },
  { icon: FileText, title: "Reports & exports", description: "Auto-generated PTM reports, term summaries, and CSV exports for record keeping." },
  { icon: ShieldCheck, title: "Privacy & compliance", description: "Role-based access, encrypted data, and full guardian-consent workflows built in." },
];

function SchoolsPage() {
  return (
    <PublicShell
      eyebrow="For Institutions"
      title={<>Adaptive learning <span className="text-gradient bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">at school scale</span></>}
      description="Deploy Smart Lab Online across grades and sections with teacher accounts, class analytics, and institution-wide mastery tracking."
      primaryCta={{ label: "Talk to sales", to: "/contact" }}
      secondaryCta={{ label: "Book a demo", to: "/demo" }}
      features={offerings}
    />
  );
}
