import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, FileText, Star, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/student/notes")({
  head: () => ({ meta: [{ title: "Notes — Smart Lab Online" }] }),
  component: NotesPage,
});

const notes = [
  { id: "1", title: "Polynomials — key identities", subject: "Math", updated: "2h ago", starred: true, ai: true },
  { id: "2", title: "Newton's laws cheat sheet", subject: "Science", updated: "Yesterday", starred: false, ai: true },
  { id: "3", title: "French Revolution timeline", subject: "Social", updated: "3 days ago", starred: true, ai: false },
  { id: "4", title: "Vocabulary — week 18", subject: "English", updated: "1 week ago", starred: false, ai: true },
];

function NotesPage() {
  const [q, setQ] = useState("");
  const filtered = notes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Notes</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Your study notes</h1>
          <p className="text-muted-foreground">AI-generated summaries plus your own notes, organized by subject.</p>
        </div>
        <Button><Plus className="size-4" /> New note</Button>
      </header>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-9" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((n) => (
          <article key={n.id} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <div className="flex items-start justify-between">
              <FileText className="text-primary size-5" />
              {n.starred && <Star className="size-4 fill-warning text-warning" />}
            </div>
            <h2 className="mt-3 font-display text-base font-semibold">{n.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{n.subject}</Badge>
              {n.ai && (
                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                  <Sparkles className="size-3" /> AI
                </Badge>
              )}
              <span className="text-muted-foreground">{n.updated}</span>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No notes match "{q}".
          </div>
        )}
      </div>
    </div>
  );
}
