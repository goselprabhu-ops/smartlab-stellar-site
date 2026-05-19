import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, FileText, PlayCircle, NotebookPen, ExternalLink,
  ListChecks, BookOpen, Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { getChapter } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/student/courses/$subjectId/$chapterId")({
  component: ChapterReader,
});

const KIND_ICON = {
  video: PlayCircle,
  pdf: FileText,
  note: NotebookPen,
  link: ExternalLink,
} as const;

function ChapterReader() {
  const { subjectId, chapterId } = Route.useParams();
  const fn = useServerFn(getChapter);
  const { data, isLoading } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => fn({ data: { chapterId } }),
  });

  if (isLoading) return <LoadingState label="Loading chapter" />;
  if (!data?.chapter) {
    return (
      <EmptyState icon={BookOpen} title="Chapter not found"
        description="It may have been unpublished. Pick another from the subject view." />
    );
  }

  const { chapter, topics, resources } = data;
  const sub = chapter.subjects as {
    name?: string; classes?: { label?: string };
  } | null;

  const videos = resources.filter((r) => r.kind === "video");
  const pdfs = resources.filter((r) => r.kind === "pdf");
  const notes = resources.filter((r) => r.kind === "note");
  const links = resources.filter((r) => r.kind === "link");

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/student/courses/$subjectId" params={{ subjectId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to {sub?.name}
      </Link>

      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6 elev-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {sub?.classes?.label} · {sub?.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{chapter.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {(chapter.tags ?? []).map((t: string) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" /> Chapter {chapter.order_index}
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><BookOpen className="mr-1 size-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="videos"><PlayCircle className="mr-1 size-3.5" />Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="pdfs"><FileText className="mr-1 size-3.5" />PDFs ({pdfs.length})</TabsTrigger>
          <TabsTrigger value="notes"><NotebookPen className="mr-1 size-3.5" />Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="quizzes"><ListChecks className="mr-1 size-3.5" />Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <article className="prose prose-sm max-w-none rounded-2xl border bg-card p-6 elev-2 dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{chapter.summary_md}</pre>
          </article>

          {topics.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-semibold">Topics</h2>
              <ol className="space-y-2">
                {topics.map((t) => (
                  <li key={t.id} className="rounded-lg border bg-card p-4">
                    <div className="text-xs text-muted-foreground">Topic {t.order_index}</div>
                    <div className="font-medium">{t.title}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {links.length > 0 && (
            <ResourceGrid items={links} />
          )}
        </TabsContent>

        <TabsContent value="videos"><ResourceGrid items={videos} empty="No videos yet" /></TabsContent>
        <TabsContent value="pdfs"><ResourceGrid items={pdfs} empty="No PDFs yet" /></TabsContent>
        <TabsContent value="notes"><ResourceGrid items={notes} empty="No notes yet" /></TabsContent>

        <TabsContent value="quizzes">
          <EmptyState icon={ListChecks} title="Quizzes coming soon"
            description="Adaptive quizzes for this chapter will appear here." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ResourceItem = {
  id: string;
  kind: "video" | "pdf" | "note" | "link";
  title: string;
  description?: string | null;
  url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  tags?: string[] | null;
};

function ResourceGrid({ items, empty }: { items: ResourceItem[]; empty?: string }) {
  if (items.length === 0) {
    return <EmptyState icon={BookOpen} title={empty ?? "Nothing here yet"} description="Check back soon." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => {
        const Icon = KIND_ICON[r.kind];
        return (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
            className="group hover-lift overflow-hidden rounded-2xl border bg-card elev-2">
            {r.thumbnail_url ? (
              <img src={r.thumbnail_url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                <Icon className="size-10 text-primary" />
              </div>
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">{r.kind}</Badge>
                {r.duration_seconds ? (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(r.duration_seconds / 60)} min
                  </span>
                ) : null}
              </div>
              <div className="font-medium">{r.title}</div>
              {r.description && <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
            </div>
          </a>
        );
      })}
    </div>
  );
}
