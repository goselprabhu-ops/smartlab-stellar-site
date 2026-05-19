import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Atom, BookOpen, Briefcase, Calculator, FlaskConical, Globe2,
  Languages, Microscope, Receipt, Search, Sparkles, TrendingUp, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { listClasses, listSubjects, searchContent } from "@/lib/content.functions";

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator, Atom, Globe2, BookOpen, Languages, FlaskConical, Microscope,
  Receipt, Briefcase, TrendingUp,
};

const TAG_FILTERS = ["core", "language", "board", "science-stream", "commerce", "humanities"];

export const Route = createFileRoute("/_authenticated/student/courses/")({
  component: CoursesCatalog,
});

function CoursesCatalog() {
  const classesFn = useServerFn(listClasses);
  const subjectsFn = useServerFn(listSubjects);
  const searchFn = useServerFn(searchContent);

  const [classId, setClassId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | undefined>();

  const classes = useQuery({ queryKey: ["classes"], queryFn: () => classesFn() });

  const subjects = useQuery({
    queryKey: ["subjects", classId, tag],
    queryFn: () => subjectsFn({ data: { classId, tags: tag ? [tag] : undefined } }),
  });

  const search = useQuery({
    enabled: query.trim().length >= 2,
    queryKey: ["search-content", query, classId, tag],
    queryFn: () =>
      searchFn({ data: { query: query.trim(), classId, tags: tag ? [tag] : undefined } }),
  });

  const grouped = useMemo(() => {
    const m = new Map<string, typeof subjects.data>();
    (subjects.data ?? []).forEach((s) => {
      const key = (s.classes as { label?: string } | null)?.label ?? "Other";
      const list = m.get(key) ?? [];
      list.push(s);
      m.set(key, list);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [subjects.data]);

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Catalog · CBSE 6–12
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Pick your next subject
        </h1>
        <p className="text-muted-foreground">
          Hierarchical content: Class → Subject → Chapter → Topic → Video, PDF, Notes & Quiz.
        </p>
      </header>

      {/* Search + filters */}
      <div className="space-y-4 rounded-2xl border bg-card p-5 elev-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, chapters, videos, PDFs, notes…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!classId} onClick={() => setClassId(undefined)}>All classes</FilterChip>
          {(classes.data ?? []).map((c) => (
            <FilterChip key={c.id} active={classId === c.id} onClick={() => setClassId(c.id)}>
              {c.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!tag} onClick={() => setTag(undefined)}>All tags</FilterChip>
          {TAG_FILTERS.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</FilterChip>
          ))}
        </div>
      </div>

      {/* Search results */}
      {query.trim().length >= 2 && (
        <section className="space-y-4 rounded-2xl border bg-card p-6 elev-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Search results</h2>
            {search.isLoading && <span className="text-xs text-muted-foreground">Searching…</span>}
          </div>
          {search.data && (
            <div className="grid gap-6 lg:grid-cols-3">
              <ResultColumn title="Subjects" empty="No subjects" count={search.data.subjects.length}>
                {search.data.subjects.map((s) => (
                  <Link key={s.id} to="/student/courses/$subjectId" params={{ subjectId: s.id }}
                    className="block rounded-lg border bg-background p-3 hover:bg-accent">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(s.classes as { label?: string } | null)?.label}
                    </div>
                  </Link>
                ))}
              </ResultColumn>
              <ResultColumn title="Chapters" empty="No chapters" count={search.data.chapters.length}>
                {search.data.chapters.map((c) => {
                  const sub = c.subjects as { name?: string; classes?: { label?: string } } | null;
                  return (
                    <Link key={c.id} to="/student/courses/$subjectId/$chapterId"
                      params={{ subjectId: c.subject_id, chapterId: c.id }}
                      className="block rounded-lg border bg-background p-3 hover:bg-accent">
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {sub?.classes?.label} · {sub?.name}
                      </div>
                    </Link>
                  );
                })}
              </ResultColumn>
              <ResultColumn title="Resources" empty="No videos / PDFs / notes" count={search.data.resources.length}>
                {search.data.resources.map((r) => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                    className="block rounded-lg border bg-background p-3 hover:bg-accent">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Badge variant="outline" className="uppercase text-[10px]">{r.kind}</Badge>
                      {r.title}
                    </div>
                  </a>
                ))}
              </ResultColumn>
            </div>
          )}
        </section>
      )}

      {/* Subjects grouped by class */}
      {subjects.isLoading ? (
        <LoadingState label="Loading subjects" />
      ) : grouped.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" description="Try clearing filters." />
      ) : (
        <div className="space-y-10">
          {grouped.map(([label, list]) => (
            <section key={label} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{label}</h2>
                <span className="text-xs text-muted-foreground">{list?.length ?? 0} subjects</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(list ?? []).map((s) => {
                  const Icon = ICON[s.icon ?? "BookOpen"] ?? BookOpen;
                  return (
                    <Link key={s.id} to="/student/courses/$subjectId" params={{ subjectId: s.id }}
                      className="group hover-lift relative overflow-hidden rounded-2xl border bg-card p-5 elev-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
                      <div className="relative space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
                            <Icon className="size-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{label} · CBSE</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(s.tags ?? []).slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 pt-1 text-sm font-medium text-primary transition-all group-hover:gap-2">
                          Explore chapters <ArrowRight className="size-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick} className="h-7 rounded-full text-xs">
      {children}
    </Button>
  );
}

function ResultColumn({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">
        {count === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : children}
      </div>
    </div>
  );
}
