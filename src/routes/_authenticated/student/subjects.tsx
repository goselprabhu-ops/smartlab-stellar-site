import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Atom, Globe2, Languages, FlaskConical, Trophy, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/student/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Smart Lab Online" }] }),
  component: SubjectsPage,
});

const subjects = [
  { key: "math",    icon: Calculator,    name: "Mathematics",  chapters: 14, mastery: 72, color: "from-blue-500/20 to-cyan-400/20" },
  { key: "science", icon: Atom,          name: "Science",      chapters: 12, mastery: 58, color: "from-emerald-500/20 to-teal-400/20" },
  { key: "social",  icon: Globe2,        name: "Social Studies", chapters: 10, mastery: 64, color: "from-amber-500/20 to-orange-400/20" },
  { key: "english", icon: Languages,     name: "English",      chapters: 8,  mastery: 81, color: "from-violet-500/20 to-purple-400/20" },
  { key: "hindi",   icon: Languages,     name: "Hindi",        chapters: 8,  mastery: 49, color: "from-rose-500/20 to-pink-400/20" },
  { key: "olymp",   icon: Trophy,        name: "Olympiad Prep",chapters: 6,  mastery: 33, color: "from-yellow-500/20 to-amber-400/20" },
];

function SubjectsPage() {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Your subjects</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Pick a subject to continue</h1>
        <p className="text-muted-foreground">Mastery is calculated live from your recent activity across every micro-concept.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Link key={s.key} to="/student/courses" className="group hover-lift relative overflow-hidden rounded-2xl border bg-card p-6 elev-2">
            <div className={`bg-gradient-to-br ${s.color} absolute inset-0 opacity-40`} />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="bg-background/80 inline-flex size-11 items-center justify-center rounded-xl backdrop-blur">
                  <s.icon className="size-5 text-primary" />
                </div>
                <Badge variant="outline">{s.chapters} chapters</Badge>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">{s.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Adaptive · CBSE aligned</p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-mono font-medium">{s.mastery}%</span>
                </div>
                <Progress value={s.mastery} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Open subject <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
