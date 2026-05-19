import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, Eye, EyeOff, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: AdminCourses,
});

const courses = [
  { id: "1", name: "Class 9 · Mathematics",   chapters: 14, lessons: 96, status: "Published",  updated: "2 days ago", live: true },
  { id: "2", name: "Class 9 · Science",       chapters: 12, lessons: 88, status: "Published",  updated: "1 week ago", live: true },
  { id: "3", name: "Class 10 · Social Studies", chapters: 10, lessons: 72, status: "Draft", updated: "3 days ago", live: false },
  { id: "4", name: "Class 11 · Physics",      chapters: 8,  lessons: 54, status: "Draft",      updated: "Today", live: false },
];

function AdminCourses() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Course management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Publish toggles, scheduling, and chapter coverage by course.</p>
        </div>
        <Button><Plus className="size-4" /> New course</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.map((c) => (
          <div key={c.id} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.chapters} chapters · {c.lessons} lessons</p>
                </div>
              </div>
              <Badge variant="outline" className={c.live ? "bg-success/15 text-success border-success/30" : ""}>
                {c.status}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="size-3" /> {c.updated}</span>
              <label className="flex items-center gap-2">
                {c.live ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} Live
                <Switch defaultChecked={c.live} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
