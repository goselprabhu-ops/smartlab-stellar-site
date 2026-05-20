import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  FolderTree,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Layers,
  FileText,
  BookOpen,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurriculumTree,
  ingestChapterFromText,
  listIngestionJobs,
  generateQuizFromMicro,
  generateRevisionMaterial,
} from "@/lib/content-pipeline.functions";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  const [classId, setClassId] = useState<string>();
  const [subjectId, setSubjectId] = useState<string>();
  const [chapterId, setChapterId] = useState<string>();
  const [raw, setRaw] = useState("");
  const [revision, setRevision] = useState<unknown>();

  const fetchTree = useServerFn(getCurriculumTree);
  const fetchJobs = useServerFn(listIngestionJobs);
  const ingest = useServerFn(ingestChapterFromText);
  const genQuiz = useServerFn(generateQuizFromMicro);
  const genRev = useServerFn(generateRevisionMaterial);
  const qc = useQueryClient();

  const tree = useQuery({
    queryKey: ["pipeline-tree", classId, subjectId, chapterId],
    queryFn: () => fetchTree({ data: { classId, subjectId, chapterId } }),
  });
  const jobs = useQuery({
    queryKey: ["ingestion-jobs"],
    queryFn: () => fetchJobs({}),
    refetchInterval: 4000,
  });

  const microConcepts = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    for (const p of tree.data?.paragraphs ?? []) {
      for (const c of (p as { concepts?: { micro_concepts?: { id: string; title: string }[] }[] }).concepts ?? []) {
        for (const m of c.micro_concepts ?? []) list.push(m);
      }
    }
    return list;
  }, [tree.data?.paragraphs]);

  const ingestMut = useMutation({
    mutationFn: () => ingest({ data: { chapter_id: chapterId!, raw } }),
    onSuccess: (r) => {
      toast.success(`Ingested ${r.paragraphs}p · ${r.concepts}c · ${r.micro_concepts}m`);
      setRaw("");
      qc.invalidateQueries({ queryKey: ["pipeline-tree"] });
      qc.invalidateQueries({ queryKey: ["ingestion-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revisionMut = useMutation({
    mutationFn: () => genRev({ data: { chapter_id: chapterId! } }),
    onSuccess: (r) => {
      setRevision(r);
      toast.success("Revision pack generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Content pipeline
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          CBSE academic content engine
        </h1>
        <p className="text-sm text-muted-foreground">
          Class → Subject → Chapter → Paragraph → Concept → Micro-concept.
          Ingest, tag, map, and generate adaptive material.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        {/* Navigator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4" /> Navigator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SelectField
              label="Class"
              value={classId}
              onChange={(v) => {
                setClassId(v);
                setSubjectId(undefined);
                setChapterId(undefined);
              }}
              options={(tree.data?.classes ?? []).map((c) => ({
                value: c.id,
                label: c.label,
              }))}
              loading={tree.isLoading}
            />
            <SelectField
              label="Subject"
              value={subjectId}
              onChange={(v) => {
                setSubjectId(v);
                setChapterId(undefined);
              }}
              options={(tree.data?.subjects ?? []).map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              disabled={!classId}
            />
            <SelectField
              label="Chapter"
              value={chapterId}
              onChange={setChapterId}
              options={(tree.data?.chapters ?? []).map((c) => ({
                value: c.id,
                label: c.title,
              }))}
              disabled={!subjectId}
            />

            <div className="space-y-1 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Recent ingestion jobs
              </p>
              <ScrollArea className="h-48 rounded-md border">
                <ul className="divide-y text-sm">
                  {(jobs.data ?? []).map((j) => (
                    <li key={j.id} className="flex items-start gap-2 p-2">
                      <JobIcon status={j.status} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{j.title ?? "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {j.status}
                          {j.stats && typeof j.stats === "object"
                            ? ` · ${(j.stats as { paragraphs?: number }).paragraphs ?? 0}p / ${(j.stats as { concepts?: number }).concepts ?? 0}c / ${(j.stats as { micro_concepts?: number }).micro_concepts ?? 0}m`
                            : ""}
                        </p>
                        {j.error && (
                          <p className="truncate text-xs text-destructive">{j.error}</p>
                        )}
                      </div>
                    </li>
                  ))}
                  {!jobs.data?.length && (
                    <li className="p-3 text-xs text-muted-foreground">No jobs yet.</li>
                  )}
                </ul>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Workspace */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> AI ingestion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste raw chapter text. The pipeline structures it into
                paragraphs, concepts and micro-concepts, then auto-tags for
                searchable retrieval.
              </p>
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Paste chapter content (NCERT / teacher notes / textbook excerpt)…"
                rows={8}
                disabled={!chapterId}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {raw.length.toLocaleString()} chars · {chapterId ? "Ready" : "Select a chapter first"}
                </p>
                <Button
                  onClick={() => ingestMut.mutate()}
                  disabled={!chapterId || raw.length < 200 || ingestMut.isPending}
                >
                  {ingestMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Ingest with AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {chapterId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4" /> Chapter tree
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revisionMut.mutate()}
                  disabled={revisionMut.isPending}
                >
                  {revisionMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="mr-2 h-4 w-4" />
                  )}
                  Revision pack
                </Button>
              </CardHeader>
              <CardContent>
                {tree.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <ChapterTree
                    paragraphs={tree.data?.paragraphs ?? []}
                    onGenerateQuiz={async (microId) => {
                      try {
                        const r = await genQuiz({
                          data: { micro_concept_id: microId, persist: true },
                        });
                        toast.success(
                          `Generated ${r.questions.length} questions${r.quiz_id ? " · saved" : ""}`,
                        );
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {revision != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Generated revision material
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(revision, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  loading,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading…" : `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function JobIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="mt-0.5 h-4 w-4 text-destructive" />;
  return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-muted-foreground" />;
}

type ParagraphNode = {
  id: string;
  title: string;
  summary_md?: string | null;
  concepts?: {
    id: string;
    title: string;
    summary_md?: string | null;
    micro_concepts?: {
      id: string;
      title: string;
      learning_objective?: string | null;
      difficulty?: number | null;
      bloom_level?: string | null;
      estimated_minutes?: number | null;
      tags?: string[] | null;
    }[];
  }[];
};

function ChapterTree({
  paragraphs,
  onGenerateQuiz,
}: {
  paragraphs: ParagraphNode[];
  onGenerateQuiz: (microId: string) => void | Promise<void>;
}) {
  if (!paragraphs.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No paragraphs yet. Use AI ingestion above to populate this chapter.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {paragraphs.map((p) => (
        <div key={p.id} className="rounded-md border p-3">
          <p className="font-medium">{p.title}</p>
          {p.summary_md && (
            <p className="text-sm text-muted-foreground">{p.summary_md}</p>
          )}
          <div className="mt-3 space-y-3 pl-3">
            {(p.concepts ?? []).map((c) => (
              <div key={c.id} className="border-l-2 pl-3">
                <p className="text-sm font-medium">{c.title}</p>
                {c.summary_md && (
                  <p className="text-xs text-muted-foreground">{c.summary_md}</p>
                )}
                <ul className="mt-2 space-y-1">
                  {(c.micro_concepts ?? []).map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start justify-between gap-3 rounded-md bg-muted/40 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.title}</p>
                        {m.learning_objective && (
                          <p className="truncate text-xs text-muted-foreground">
                            {m.learning_objective}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {typeof m.difficulty === "number" && (
                            <Badge variant="outline">L{m.difficulty}</Badge>
                          )}
                          {m.bloom_level && (
                            <Badge variant="outline">{m.bloom_level}</Badge>
                          )}
                          {typeof m.estimated_minutes === "number" && (
                            <Badge variant="outline">{m.estimated_minutes}m</Badge>
                          )}
                          {(m.tags ?? []).slice(0, 4).map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onGenerateQuiz(m.id)}
                      >
                        <Sparkles className="mr-1 h-3 w-3" /> Quiz
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
