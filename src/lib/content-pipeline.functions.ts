/**
 * Content Pipeline — server functions (admin-facing).
 *
 * Thin .functions.ts file: server-fn declarations + their imports only.
 * All heavy lifting lives in `./content/pipeline.server.ts`.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  structureChapter,
  persistTree,
  generateQuizForMicro,
  generateRevisionForChapter,
} from "@/lib/content/pipeline.server";

/* ─────────────────────────  Tree browser  ───────────────────────── */

export const getCurriculumTree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        classId: z.string().uuid().optional(),
        subjectId: z.string().uuid().optional(),
        chapterId: z.string().uuid().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const [classes, subjects, chapters, paragraphs] = await Promise.all([
      supabaseAdmin
        .from("classes")
        .select("id, label, order_index")
        .order("order_index"),
      data.classId
        ? supabaseAdmin
            .from("subjects")
            .select("id, name, slug, class_id, tags")
            .eq("class_id", data.classId)
            .order("name")
        : Promise.resolve({ data: [] as never[], error: null }),
      data.subjectId
        ? supabaseAdmin
            .from("chapters")
            .select("id, title, slug, order_index, published, tags, subject_id")
            .eq("subject_id", data.subjectId)
            .order("order_index")
        : Promise.resolve({ data: [] as never[], error: null }),
      data.chapterId
        ? supabaseAdmin
            .from("paragraphs")
            .select(
              "id, title, summary_md, order_index, concepts(id, title, summary_md, order_index, micro_concepts(id, title, learning_objective, difficulty, bloom_level, estimated_minutes, tags, order_index))",
            )
            .eq("chapter_id", data.chapterId)
            .order("order_index")
        : Promise.resolve({ data: [] as never[], error: null }),
    ]);

    return {
      classes: classes.data ?? [],
      subjects: subjects.data ?? [],
      chapters: chapters.data ?? [],
      paragraphs: paragraphs.data ?? [],
    };
  });

/* ─────────────────────────  Manual CRUD (admin)  ───────────────────────── */

export const upsertChapter = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        subject_id: z.string().uuid(),
        title: z.string().trim().min(1).max(200),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .regex(/^[a-z0-9-]+$/),
        summary_md: z.string().max(8000).optional().nullable(),
        order_index: z.number().int().min(0).default(0),
        tags: z.array(z.string().min(1).max(40)).max(20).default([]),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("chapters")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertMicroConcept = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        concept_id: z.string().uuid(),
        title: z.string().trim().min(1).max(200),
        learning_objective: z.string().trim().max(500).optional().nullable(),
        content_md: z.string().max(20000).optional().nullable(),
        difficulty: z.number().int().min(1).max(5).default(2),
        bloom_level: z
          .enum(["remember", "understand", "apply", "analyze", "evaluate", "create"])
          .optional()
          .nullable(),
        estimated_minutes: z.number().int().min(1).max(120).default(8),
        order_index: z.number().int().min(0).default(0),
        tags: z.array(z.string().min(1).max(40)).max(20).default([]),
        prerequisite_ids: z.array(z.string().uuid()).max(20).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("micro_concepts")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ─────────────────────────  Concept mapping  ───────────────────────── */

export const linkConcepts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        source_id: z.string().uuid(),
        target_id: z.string().uuid(),
        relation: z.enum(["prerequisite", "related", "applies", "extends"]),
        weight: z.number().min(0).max(1).default(1),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("concept_relations")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const unlinkConcepts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("concept_relations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─────────────────────────  AI Ingestion  ───────────────────────── */

export const ingestChapterFromText = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        chapter_id: z.string().uuid(),
        raw: z.string().trim().min(200).max(40000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Resolve chapter context
    const { data: chapter, error: ce } = await supabaseAdmin
      .from("chapters")
      .select("id, title, subjects(name, classes(label))")
      .eq("id", data.chapter_id)
      .single();
    if (ce || !chapter) throw new Error("Chapter not found");

    const subject = chapter.subjects as { name?: string; classes?: { label?: string } } | null;

    const { data: job, error: je } = await supabaseAdmin
      .from("ingestion_jobs")
      .insert({
        requested_by: context.userId,
        source: "ai-text",
        scope: "chapter",
        chapter_id: data.chapter_id,
        title: chapter.title,
        input_preview: data.raw.slice(0, 500),
        status: "running",
      })
      .select("id")
      .single();
    if (je || !job) throw new Error(je?.message ?? "ingest job create failed");

    try {
      const tree = await structureChapter({
        userId: context.userId,
        classLabel: subject?.classes?.label ?? "",
        subjectName: subject?.name ?? "",
        chapterTitle: chapter.title,
        raw: data.raw,
      });

      const stats = await persistTree({ chapterId: data.chapter_id, tree });

      await supabaseAdmin
        .from("ingestion_jobs")
        .update({
          status: "completed",
          stats,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return { ok: true, job_id: job.id, ...stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("ingestion_jobs")
        .update({ status: "failed", error: message })
        .eq("id", job.id);
      throw err;
    }
  });

export const listIngestionJobs = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("ingestion_jobs")
      .select("id, title, status, scope, stats, error, cost_cents, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ─────────────────────────  AI Quiz + Revision  ───────────────────────── */

export const generateQuizFromMicro = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        micro_concept_id: z.string().uuid(),
        persist: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const questions = await generateQuizForMicro({
      userId: context.userId,
      microConceptId: data.micro_concept_id,
    });

    if (!data.persist) return { questions, quiz_id: null };

    const { data: mc } = await supabaseAdmin
      .from("micro_concepts")
      .select("title, concept_id")
      .eq("id", data.micro_concept_id)
      .single();

    const { data: quiz, error: qe } = await supabaseAdmin
      .from("quizzes")
      .insert({
        title: `AI: ${mc?.title ?? "Practice"}`,
        kind: "micro",
        published: true,
        created_by: context.userId,
        difficulty: 2,
      })
      .select("id")
      .single();
    if (qe || !quiz) throw new Error(qe?.message ?? "quiz insert failed");

    const rows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      micro_concept_id: data.micro_concept_id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correct: q.correct,
      points: q.points,
      order_index: i,
    }));
    if (rows.length) {
      const { error: ie } = await supabaseAdmin.from("quiz_questions").insert(rows);
      if (ie) throw new Error(ie.message);
    }

    return { questions, quiz_id: quiz.id };
  });

export const generateRevisionMaterial = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z.object({ chapter_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    return generateRevisionForChapter({
      userId: context.userId,
      chapterId: data.chapter_id,
    });
  });
