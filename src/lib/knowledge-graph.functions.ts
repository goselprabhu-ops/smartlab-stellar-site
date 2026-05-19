/**
 * Knowledge Graph — traversal, sequencing, and mastery server functions.
 *
 * Exposes the curriculum tree + typed concept relations + per-student mastery
 * to the UI. All reads respect RLS (user-scoped supabase client via
 * requireSupabaseAuth).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------- types ----------------
export type GraphNode = {
  id: string;
  title: string;
  conceptId: string;
  difficulty: number;
  bloom: string | null;
  estimatedMinutes: number;
  tags: string[];
  mastery: number;
  state: string;
};
export type GraphEdge = {
  source: string;
  target: string;
  relation: string;
  weight: number;
};

// ---------------- 1. Full knowledge graph for a chapter ----------------
export const getChapterGraph = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ chapterId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Pull every micro-concept under this chapter via the hierarchy
    const { data: rows, error } = await supabase
      .from("micro_concepts")
      .select(`
        id, title, difficulty, bloom_level, estimated_minutes, tags,
        concept_id,
        concepts:concept_id (
          id, title, paragraph_id,
          paragraphs:paragraph_id ( id, title, chapter_id )
        )
      `);
    if (error) throw new Error(error.message);
    const filtered = (rows ?? []).filter(
      (r: any) => r.concepts?.paragraphs?.chapter_id === data.chapterId,
    );
    const microIds = filtered.map((r: any) => r.id);
    if (microIds.length === 0) {
      return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    }

    const [{ data: relations }, { data: mastery }, { data: sessions }] = await Promise.all([
      supabase.from("concept_relations")
        .select("source_id, target_id, relation, weight")
        .in("source_id", microIds),
      supabase.from("concept_mastery")
        .select("micro_concept_id, mastery")
        .eq("student_id", userId)
        .in("micro_concept_id", microIds),
      supabase.from("learning_sessions")
        .select("micro_concept_id, state, mastery")
        .eq("student_id", userId)
        .in("micro_concept_id", microIds),
    ]);

    const masteryMap = new Map<string, number>(
      (mastery ?? []).map((m: any) => [m.micro_concept_id, Number(m.mastery)]),
    );
    const sessionMap = new Map<string, { state: string; mastery: number }>(
      (sessions ?? []).map((s: any) => [
        s.micro_concept_id,
        { state: s.state, mastery: Number(s.mastery) },
      ]),
    );

    const nodes: GraphNode[] = filtered.map((r: any) => {
      const m = masteryMap.get(r.id) ?? sessionMap.get(r.id)?.mastery ?? 0;
      return {
        id: r.id,
        title: r.title,
        conceptId: r.concept_id,
        difficulty: r.difficulty,
        bloom: r.bloom_level,
        estimatedMinutes: r.estimated_minutes,
        tags: r.tags ?? [],
        mastery: m,
        state: sessionMap.get(r.id)?.state ?? "not_started",
      };
    });
    const edges: GraphEdge[] = (relations ?? [])
      .filter((e: any) => microIds.includes(e.target_id))
      .map((e: any) => ({
        source: e.source_id,
        target: e.target_id,
        relation: e.relation,
        weight: Number(e.weight),
      }));

    return { nodes, edges };
  });

// ---------------- 2. Neighbors of a micro-concept ----------------
export const getConceptNeighbors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: out }, { data: incoming }] = await Promise.all([
      supabase.from("concept_relations")
        .select("relation, weight, target:target_id ( id, title, difficulty )")
        .eq("source_id", data.microConceptId),
      supabase.from("concept_relations")
        .select("relation, weight, source:source_id ( id, title, difficulty )")
        .eq("target_id", data.microConceptId),
    ]);
    return {
      outgoing: out ?? [],
      incoming: incoming ?? [],
    };
  });

// ---------------- 3. Adaptive learning path ----------------
// Builds a topologically-ordered path of micro-concepts the student should
// study next, honouring prerequisite + builds_on edges and avoiding mastered
// nodes. Limited to `limit` items; greedy by lowest current mastery & lowest
// difficulty among ready (unblocked) candidates.
export const getLearningPath = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      chapterId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(20).default(8),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Scope: chapter or everything the student can read
    let microQuery = supabase
      .from("micro_concepts")
      .select(`
        id, title, difficulty, bloom_level, estimated_minutes, prerequisite_ids,
        concept_id,
        concepts:concept_id (
          paragraph_id,
          paragraphs:paragraph_id ( chapter_id )
        )
      `);
    const { data: allRows, error } = await microQuery;
    if (error) throw new Error(error.message);
    const rows = (allRows ?? []).filter((r: any) =>
      data.chapterId ? r.concepts?.paragraphs?.chapter_id === data.chapterId : true,
    );
    const microIds = rows.map((r: any) => r.id);
    if (!microIds.length) return { path: [] as Array<{ id: string; title: string; reason: string }>, blocked: 0 };

    const [{ data: prereqEdges }, { data: mastery }, { data: sessions }] = await Promise.all([
      supabase.from("concept_relations")
        .select("source_id, target_id, weight")
        .in("target_id", microIds)
        .in("relation", ["prerequisite", "builds_on"]),
      supabase.from("concept_mastery")
        .select("micro_concept_id, mastery")
        .eq("student_id", userId)
        .in("micro_concept_id", microIds),
      supabase.from("learning_sessions")
        .select("micro_concept_id, state, mastery")
        .eq("student_id", userId)
        .in("micro_concept_id", microIds),
    ]);

    const masteryOf = (id: string) => {
      const m = (mastery ?? []).find((x: any) => x.micro_concept_id === id);
      if (m) return Number(m.mastery);
      const s = (sessions ?? []).find((x: any) => x.micro_concept_id === id);
      return s ? Number(s.mastery) : 0;
    };
    const isMastered = (id: string) => {
      const s = (sessions ?? []).find((x: any) => x.micro_concept_id === id);
      return (s && s.state === "mastered") || masteryOf(id) >= 0.85;
    };

    // Combine array prerequisite_ids and typed edges
    const inboundByNode = new Map<string, Set<string>>();
    rows.forEach((r: any) => {
      const set = new Set<string>(r.prerequisite_ids ?? []);
      inboundByNode.set(r.id, set);
    });
    (prereqEdges ?? []).forEach((e: any) => {
      const set = inboundByNode.get(e.target_id) ?? new Set<string>();
      set.add(e.source_id);
      inboundByNode.set(e.target_id, set);
    });

    const path: Array<{ id: string; title: string; reason: string }> = [];
    const chosen = new Set<string>();
    let blocked = 0;

    while (path.length < data.limit) {
      const ready = rows.filter((r: any) => {
        if (chosen.has(r.id) || isMastered(r.id)) return false;
        const prereqs = inboundByNode.get(r.id) ?? new Set<string>();
        for (const p of prereqs) {
          if (!isMastered(p) && !chosen.has(p)) return false;
        }
        return true;
      });
      if (!ready.length) {
        blocked = rows.filter((r: any) => !chosen.has(r.id) && !isMastered(r.id)).length;
        break;
      }
      ready.sort(
        (a: any, b: any) =>
          masteryOf(a.id) - masteryOf(b.id) ||
          a.difficulty - b.difficulty ||
          (a.estimated_minutes ?? 0) - (b.estimated_minutes ?? 0),
      );
      const next = ready[0];
      const m = masteryOf(next.id);
      const reason =
        m > 0 && m < 0.85
          ? `Mastery ${(m * 100).toFixed(0)}% — finish this before moving on.`
          : "Next unblocked concept on your path.";
      path.push({ id: next.id, title: next.title, reason });
      chosen.add(next.id);
    }
    return { path, blocked };
  });

// ---------------- 4. Mastery heatmap (for dashboard / parent view) ----------------
export const getMasteryHeatmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ studentId: z.string().uuid().optional() }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.studentId ?? userId;
    // Aggregate mastery rolled up to subjects → chapters
    const { data: rows, error } = await supabase
      .from("concept_mastery")
      .select(`
        mastery, micro_concept_id,
        micro_concepts:micro_concept_id (
          concepts:concept_id (
            paragraphs:paragraph_id (
              chapters:chapter_id ( id, title, subject_id, subjects:subject_id ( id, name ) )
            )
          )
        )
      `)
      .eq("student_id", target);
    if (error) throw new Error(error.message);

    const bySubject = new Map<string, { id: string; name: string; total: number; sum: number; chapters: Map<string, { id: string; title: string; total: number; sum: number }> }>();
    for (const row of rows ?? []) {
      const chap = (row as any).micro_concepts?.concepts?.paragraphs?.chapters;
      if (!chap?.subjects) continue;
      const subj = chap.subjects;
      const s = bySubject.get(subj.id) ?? { id: subj.id, name: subj.name, total: 0, sum: 0, chapters: new Map() };
      s.total += 1;
      s.sum += Number(row.mastery);
      const c = s.chapters.get(chap.id) ?? { id: chap.id, title: chap.title, total: 0, sum: 0 };
      c.total += 1;
      c.sum += Number(row.mastery);
      s.chapters.set(chap.id, c);
      bySubject.set(subj.id, s);
    }

    return {
      subjects: Array.from(bySubject.values()).map((s) => ({
        id: s.id,
        name: s.name,
        avgMastery: s.total ? s.sum / s.total : 0,
        chapters: Array.from(s.chapters.values()).map((c) => ({
          id: c.id,
          title: c.title,
          avgMastery: c.total ? c.sum / c.total : 0,
          tracked: c.total,
        })),
      })),
    };
  });

// ---------------- 5. Update rolling mastery (called by the loop) ----------------
// Applies a new mastery sample with simple exponential smoothing and sets a
// decay timestamp for spaced review surfacing.
const SAMPLE_WEIGHT = 0.6;
const REVIEW_DAYS_BY_MASTERY = (m: number) =>
  m >= 0.9 ? 14 : m >= 0.75 ? 7 : m >= 0.5 ? 3 : 1;

export const updateConceptMastery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      microConceptId: z.string().uuid(),
      sample: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1).default(0.5),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("concept_mastery")
      .select("mastery, streak")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    const prev = existing ? Number(existing.mastery) : 0;
    const next = Math.max(0, Math.min(1, prev * (1 - SAMPLE_WEIGHT) + data.sample * SAMPLE_WEIGHT));
    const streak = (existing?.streak ?? 0) + (data.sample >= 0.7 ? 1 : -1 * (existing?.streak ?? 0));
    const decayAt = new Date(Date.now() + REVIEW_DAYS_BY_MASTERY(next) * 86400 * 1000).toISOString();

    const { error } = await supabase.from("concept_mastery").upsert(
      {
        student_id: userId,
        micro_concept_id: data.microConceptId,
        mastery: next,
        confidence: data.confidence,
        streak: Math.max(0, streak),
        last_practiced_at: new Date().toISOString(),
        decay_at: decayAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,micro_concept_id" },
    );
    if (error) throw new Error(error.message);
    return { mastery: next, decayAt };
  });

// ---------------- 6. Due-for-review (spaced revision) ----------------
export const getDueForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("concept_mastery")
      .select("micro_concept_id, mastery, decay_at, micro_concepts:micro_concept_id ( id, title )")
      .eq("student_id", userId)
      .lte("decay_at", new Date().toISOString())
      .order("decay_at", { ascending: true })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return {
      items: (rows ?? []).map((r: any) => ({
        microConceptId: r.micro_concept_id,
        title: r.micro_concepts?.title ?? "Untitled",
        mastery: Number(r.mastery),
        dueAt: r.decay_at,
      })),
    };
  });
