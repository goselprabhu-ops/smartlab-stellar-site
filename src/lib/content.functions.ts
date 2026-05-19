import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const resourceKind = z.enum(["video", "pdf", "note", "link"]);

export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("classes")
      .select("id, label, order_index")
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listSubjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        classId: z.string().uuid().optional(),
        search: z.string().trim().max(120).optional(),
        tags: z.array(z.string().max(40)).max(10).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("subjects")
      .select("id, name, slug, icon, tags, class_id, classes(label, order_index)")
      .order("name");
    if (data.classId) q = q.eq("class_id", data.classId);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.tags?.length) q = q.contains("tags", data.tags);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listChapters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        subjectId: z.string().uuid(),
        search: z.string().trim().max(120).optional(),
        tags: z.array(z.string().max(40)).max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("chapters")
      .select("id, title, slug, summary_md, order_index, tags, published")
      .eq("subject_id", data.subjectId)
      .eq("published", true)
      .order("order_index");
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.tags?.length) q = q.contains("tags", data.tags);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ chapterId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const [chapter, paragraphs, resources] = await Promise.all([
      context.supabase
        .from("chapters")
        .select("*, subjects(id, name, slug, class_id, classes(label))")
        .eq("id", data.chapterId)
        .maybeSingle(),
      context.supabase
        .from("paragraphs")
        .select("id, title, summary_md, order_index")
        .eq("chapter_id", data.chapterId)
        .order("order_index"),
      context.supabase
        .from("content_resources")
        .select("id, kind, title, description, url, thumbnail_url, duration_seconds, tags, order_index")
        .eq("chapter_id", data.chapterId)
        .eq("published", true)
        .order("order_index"),
    ]);
    if (chapter.error) throw new Error(chapter.error.message);
    return {
      chapter: chapter.data,
      topics: paragraphs.data ?? [],
      resources: resources.data ?? [],
    };
  });

export const searchContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        query: z.string().trim().min(1).max(120),
        classId: z.string().uuid().optional(),
        kind: resourceKind.optional(),
        tags: z.array(z.string().max(40)).max(10).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const term = `%${data.query}%`;

    let subjectsQ = context.supabase
      .from("subjects")
      .select("id, name, slug, class_id, classes(label)")
      .ilike("name", term)
      .limit(data.limit);
    if (data.classId) subjectsQ = subjectsQ.eq("class_id", data.classId);
    if (data.tags?.length) subjectsQ = subjectsQ.contains("tags", data.tags);

    let chaptersQ = context.supabase
      .from("chapters")
      .select("id, title, slug, subject_id, subjects(name, class_id, classes(label))")
      .ilike("title", term)
      .eq("published", true)
      .limit(data.limit);
    if (data.tags?.length) chaptersQ = chaptersQ.contains("tags", data.tags);

    let resourcesQ = context.supabase
      .from("content_resources")
      .select("id, kind, title, url, chapter_id, lesson_id, tags")
      .ilike("title", term)
      .eq("published", true)
      .limit(data.limit);
    if (data.kind) resourcesQ = resourcesQ.eq("kind", data.kind);
    if (data.tags?.length) resourcesQ = resourcesQ.contains("tags", data.tags);

    const [subj, chap, res] = await Promise.all([subjectsQ, chaptersQ, resourcesQ]);
    if (subj.error) throw new Error(subj.error.message);
    if (chap.error) throw new Error(chap.error.message);
    if (res.error) throw new Error(res.error.message);

    let chapters = chap.data ?? [];
    if (data.classId) {
      chapters = chapters.filter((c) => (c.subjects as { class_id?: string } | null)?.class_id === data.classId);
    }

    return {
      subjects: subj.data ?? [],
      chapters,
      resources: res.data ?? [],
    };
  });

export const upsertResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        chapter_id: z.string().uuid().nullable().optional(),
        paragraph_id: z.string().uuid().nullable().optional(),
        lesson_id: z.string().uuid().nullable().optional(),
        micro_concept_id: z.string().uuid().nullable().optional(),
        kind: resourceKind,
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional().nullable(),
        url: z.string().url().max(800),
        thumbnail_url: z.string().url().max(800).optional().nullable(),
        duration_seconds: z.number().int().min(0).max(36000).optional().nullable(),
        tags: z.array(z.string().min(1).max(40)).max(20).default([]),
        order_index: z.number().int().min(0).default(0),
        published: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("content_resources")
      .upsert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("content_resources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
