import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Search, ArrowRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { listChapters, listSubjects } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/student/courses/$subjectId")({
  component: SubjectPage,
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const chaptersFn = useServerFn(listChapters);
  const subjectsFn = useServerFn(listSubjects);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | undefined>();

  // We need subject metadata; lightweight lookup via list filter.
  const all = useQuery({ queryKey: ["subjects-all"], queryFn: () => subjectsFn({ data: {} }) });
  const subject = (all.data ?? []).find((s) => s.id === subjectId);

  const chapters = useQuery({
    queryKey: ["chapters", subjectId, query, tag],
    queryFn: () =>
      chaptersFn({
        data: {
          subjectId,
          search: query.trim() || undefined,
          tags: tag ? [tag] : undefined,
        },
      }),
  });

  const allTags = Array.from(new Set((chapters.data ?? []).flatMap((c) => c.tags ?? [])));

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/student/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> All subjects
      </Link>

      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6 elev-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {(subject?.classes as { label?: string } | null)?.label ?? "Subject"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {subject?.name ?? "Subject"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse chapters, then dive into topics with adaptive videos, PDFs, notes, and quizzes.
        </p>
      </header>

      <div className="space-y-3 rounded-2xl border bg-card p-4 elev-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters in this subject…"
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Chip active={!tag} onClick={() => setTag(undefined)}>All</Chip>
            {allTags.map((t) => (
              <Chip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</Chip>
            ))}
          </div>
        )}
      </div>

      {chapters.isLoading ? (
        <LoadingState />
      ) : (chapters.data ?? []).length === 0 ? (
        <EmptyState icon={BookOpen} title="No chapters" description="Try a different search or tag." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(chapters.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/student/courses/$subjectId/$chapterId"
              params={{ subjectId, chapterId: c.id }}
              className="group hover-lift rounded-2xl border bg-card p-5 elev-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-[10px]">Chapter {c.order_index}</Badge>
                  <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {(c.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
                <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick} className="h-7 rounded-full text-xs">
      {children}
    </Button>
  );
}
