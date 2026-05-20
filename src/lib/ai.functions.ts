import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  clusterWeaknesses,
  personalizedSequence,
  predictRetention,
  type MasteryRow,
} from "./ai/intelligence.server";

/**
 * Intelligence-driven recommendations. Uses the v1 engine (retention,
 * weakness clustering, dependency-aware sequencing) instead of canned text.
 */
export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: mastery }, { data: weaknesses }, { data: recalls }] = await Promise.all([
      supabase
        .from("concept_mastery")
        .select(`
          micro_concept_id, mastery, confidence, streak, last_practiced_at, decay_at,
          micro_concepts:micro_concept_id (
            id, title, difficulty, estimated_minutes, tags, prerequisite_ids, concept_id
          )
        `)
        .eq("student_id", userId),
      supabase
        .from("weakness_profile")
        .select("micro_concept_id, weakness_tags, confidence, notes, updated_at")
        .eq("student_id", userId),
      supabase
        .from("recollection_attempts")
        .select("ai_score, ai_feedback, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const rows: MasteryRow[] = (mastery ?? []).map((r: any) => ({
      microConceptId: r.micro_concept_id,
      title: r.micro_concepts?.title ?? "Micro-concept",
      conceptId: r.micro_concepts?.concept_id ?? null,
      difficulty: r.micro_concepts?.difficulty ?? 1,
      estimatedMinutes: r.micro_concepts?.estimated_minutes ?? 8,
      tags: r.micro_concepts?.tags ?? [],
      prerequisiteIds: r.micro_concepts?.prerequisite_ids ?? [],
      mastery: Number(r.mastery) || 0,
      confidence: Number(r.confidence) || 0,
      streak: Number(r.streak) || 0,
      lastPracticedAt: r.last_practiced_at,
      decayAt: r.decay_at,
    }));

    const recallSignals = (recalls ?? []).map((r: any) => ({
      score: Number(r.ai_score) || 0,
      feedback: r.ai_feedback ?? null,
      createdAt: r.created_at,
    }));
    const weaknessRows = (weaknesses ?? []).map((w: any) => ({
      microConceptId: w.micro_concept_id,
      tags: w.weakness_tags ?? [],
      confidence: Number(w.confidence) || 0,
      notes: w.notes,
      updatedAt: w.updated_at,
    }));

    // Fallback canned suggestions when the student has no history yet.
    if (!rows.length) {
      return {
        items: [
          {
            id: "rec-start",
            kind: "start",
            title: "Start your first micro-concept",
            reason: "Begin a session so the AI can learn your pace and tailor every next step.",
            cta: "Start learning",
          },
        ],
        model: "intelligence-v1",
      };
    }

    let edges: { source: string; target: string; relation: string; weight: number }[] = [];
    const ids = rows.map((r) => r.microConceptId);
    if (ids.length) {
      const { data: rels } = await supabase
        .from("concept_relations")
        .select("source_id, target_id, relation, weight")
        .in("source_id", ids);
      edges = (rels ?? []).map((r: any) => ({
        source: r.source_id,
        target: r.target_id,
        relation: r.relation,
        weight: Number(r.weight) || 1,
      }));
    }

    const sequence = personalizedSequence({
      rows,
      recentRecalls: recallSignals,
      weaknesses: weaknessRows,
      edges,
      topK: 3,
    });
    const clusters = clusterWeaknesses(weaknessRows).slice(0, 1);

    const items: Array<{
      id: string;
      kind: "revision" | "practice" | "concept" | "weakness";
      title: string;
      reason: string;
      cta: string;
      microConceptId?: string;
    }> = [];

    // Top-priority sequence item (often a revision target).
    if (sequence[0]) {
      const top = sequence[0];
      const row = rows.find((r) => r.microConceptId === top.microConceptId)!;
      const ret = predictRetention({ row, recentRecalls: recallSignals });
      const isRevision = (row.mastery ?? 0) >= 0.5;
      items.push({
        id: `seq-${top.microConceptId}`,
        kind: isRevision ? "revision" : "concept",
        title: `${isRevision ? "Revise" : "Learn"}: ${top.title}`,
        reason:
          `${top.reason}. Predicted 7-day retention ${Math.round(ret.r7d * 100)}%.`,
        cta: isRevision ? "Start revision" : "Open lesson",
        microConceptId: top.microConceptId,
      });
    }
    // Weakness-driven targeted practice.
    if (clusters[0]) {
      const cl = clusters[0];
      items.push({
        id: `cluster-${cl.tag}`,
        kind: "weakness",
        title: `Target weakness: ${cl.tag}`,
        reason: `Appears across ${cl.count} concept${cl.count > 1 ? "s" : ""} with avg confidence ${Math.round(cl.avgConfidence * 100)}%.`,
        cta: "Practice this gap",
        microConceptId: cl.microConceptIds[0],
      });
    }
    // Next concept to advance.
    const advance = sequence.find((s) => {
      const r = rows.find((x) => x.microConceptId === s.microConceptId);
      return (r?.mastery ?? 0) < 0.5;
    });
    if (advance && advance.microConceptId !== sequence[0]?.microConceptId) {
      items.push({
        id: `next-${advance.microConceptId}`,
        kind: "concept",
        title: `Concept next: ${advance.title}`,
        reason: advance.reason,
        cta: "Open lesson",
        microConceptId: advance.microConceptId,
      });
    }

    return { items, model: "intelligence-v1" };
  });
