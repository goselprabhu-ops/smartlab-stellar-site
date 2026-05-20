/**
 * Learning Intelligence — server functions.
 *
 * Surfaces the v1 intelligence engine to UI: confidence prediction,
 * retention forecast, weakness clusters, personalized sequencing, and
 * behavior signals. Pure reads + bounded AI narration (cached).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  behaviorSignals,
  clusterWeaknesses,
  extractMisconceptions,
  personalizedSequence,
  predictConfidence,
  predictRetention,
  type EvalSignal,
  type MasteryRow,
  type RecallSignal,
  type RelationEdge,
  type WeaknessRow,
} from "./ai/intelligence.server";
import { aiCall } from "./ai/core.server";

// ============================================================
// 1. Per-concept intelligence snapshot
// ============================================================
export const getConceptIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: mc }, { data: mastery }, { data: weakness }] = await Promise.all([
      supabase
        .from("micro_concepts")
        .select("id, title, difficulty, estimated_minutes, tags, prerequisite_ids, concept_id")
        .eq("id", data.microConceptId)
        .single(),
      supabase
        .from("concept_mastery")
        .select("mastery, confidence, streak, last_practiced_at, decay_at")
        .eq("student_id", userId)
        .eq("micro_concept_id", data.microConceptId)
        .maybeSingle(),
      supabase
        .from("weakness_profile")
        .select("weakness_tags, confidence, notes, updated_at")
        .eq("student_id", userId)
        .eq("micro_concept_id", data.microConceptId)
        .maybeSingle(),
    ]);
    if (!mc) throw new Error("Micro-concept not found");

    const { data: session } = await supabase
      .from("learning_sessions")
      .select("id")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    const [{ data: recalls }, { data: evals }] = await Promise.all([
      session
        ? supabase
            .from("recollection_attempts")
            .select("ai_score, ai_feedback, created_at")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] as any[] }),
      session
        ? supabase
            .from("evaluation_attempts")
            .select("score, total, per_question, created_at")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const row: MasteryRow = {
      microConceptId: mc.id,
      title: mc.title,
      conceptId: mc.concept_id,
      difficulty: mc.difficulty ?? 1,
      estimatedMinutes: mc.estimated_minutes ?? 8,
      tags: mc.tags ?? [],
      prerequisiteIds: mc.prerequisite_ids ?? [],
      mastery: Number(mastery?.mastery) || 0,
      confidence: Number(mastery?.confidence) || 0,
      streak: Number(mastery?.streak) || 0,
      lastPracticedAt: mastery?.last_practiced_at ?? null,
      decayAt: mastery?.decay_at ?? null,
    };
    const recallSignals: RecallSignal[] = (recalls ?? []).map((r: any) => ({
      score: Number(r.ai_score) || 0,
      feedback: r.ai_feedback ?? null,
      createdAt: r.created_at,
    }));
    const evalSignals: EvalSignal[] = (evals ?? []).map((e: any) => ({
      score: Number(e.score) || 0,
      total: Number(e.total) || 0,
      perQuestion: (e.per_question as any[]) ?? [],
      createdAt: e.created_at,
    }));

    const confidence = predictConfidence({
      row,
      recentRecalls: recallSignals,
      recentEvals: evalSignals,
    });
    const retention = predictRetention({ row, recentRecalls: recallSignals });
    const misconceptions = extractMisconceptions(recallSignals);

    return {
      microConcept: {
        id: mc.id,
        title: mc.title,
        difficulty: mc.difficulty,
        tags: mc.tags ?? [],
      },
      mastery: row.mastery,
      streak: row.streak,
      confidence,
      retention,
      misconceptions,
      weaknessTags: (weakness as any)?.weakness_tags ?? [],
      generatedAt: new Date().toISOString(),
    };
  });

// ============================================================
// 2. Student-wide intelligence overview
// ============================================================
export const getStudentIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        budgetMinutes: z.number().int().min(5).max(180).optional(),
        narrate: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: mastery }, { data: weaknesses }, { data: recalls }, { data: evals }] =
      await Promise.all([
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
          .limit(60),
        supabase
          .from("evaluation_attempts")
          .select("score, total, per_question, created_at")
          .eq("student_id", userId)
          .order("created_at", { ascending: false })
          .limit(60),
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

    const ids = rows.map((r) => r.microConceptId);
    let edges: RelationEdge[] = [];
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

    const recallSignals: RecallSignal[] = (recalls ?? []).map((r: any) => ({
      score: Number(r.ai_score) || 0,
      feedback: r.ai_feedback ?? null,
      createdAt: r.created_at,
    }));
    const evalSignals: EvalSignal[] = (evals ?? []).map((e: any) => ({
      score: Number(e.score) || 0,
      total: Number(e.total) || 0,
      perQuestion: (e.per_question as any[]) ?? [],
      createdAt: e.created_at,
    }));
    const weaknessRows: WeaknessRow[] = (weaknesses ?? []).map((w: any) => ({
      microConceptId: w.micro_concept_id,
      tags: w.weakness_tags ?? [],
      confidence: Number(w.confidence) || 0,
      notes: w.notes,
      updatedAt: w.updated_at,
    }));

    const clusters = clusterWeaknesses(weaknessRows).slice(0, 8);
    const behavior = behaviorSignals({ recalls: recallSignals, evals: evalSignals });
    const sequence = personalizedSequence({
      rows,
      recentRecalls: recallSignals,
      weaknesses: weaknessRows,
      edges,
      preferredMinutes: data.budgetMinutes,
      topK: 8,
    });
    const misconceptions = extractMisconceptions(recallSignals);

    // Aggregate predictions per concept (for forecast cards).
    const perConcept = rows.map((row) => {
      const conf = predictConfidence({ row, recentRecalls: recallSignals, recentEvals: evalSignals });
      const ret = predictRetention({ row, recentRecalls: recallSignals });
      return {
        microConceptId: row.microConceptId,
        title: row.title,
        mastery: row.mastery,
        predictedConfidence: conf.confidence,
        confidenceTrend: conf.trend,
        calibrationGap: conf.calibrationGap,
        r1d: ret.r1d,
        r7d: ret.r7d,
        r30d: ret.r30d,
        riskScore: ret.riskScore,
        recommendedReviewAt: ret.recommendedReviewAt,
      };
    });

    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const summary = {
      totalConcepts: rows.length,
      avgPredictedConfidence: avg(perConcept.map((p) => p.predictedConfidence)),
      avgRetention7d: avg(perConcept.map((p) => p.r7d)),
      atRisk7d: perConcept.filter((p) => p.r7d < 0.7).length,
      criticalRisk: perConcept.filter((p) => p.riskScore > 0.6).length,
      dominantWeakness: clusters[0]?.tag ?? null,
    };

    // Optional narration (AI). Cached + cheap model.
    let narrative: string | null = null;
    if (data.narrate) {
      try {
        const res = await aiCall<{ narrative: string }>(
          [
            {
              role: "system",
              content:
                "You write a concise, motivating 3-4 sentence learning intelligence narrative for a K-12 student. Return STRICT JSON { narrative }. Mention the biggest risk, biggest strength, and one suggested action. No emojis, no headings.",
            },
            {
              role: "user",
              content: JSON.stringify({ summary, topClusters: clusters.slice(0, 3), behavior, topSequence: sequence.slice(0, 3) }),
            },
          ],
          {
            module: "intelligence.narrative",
            userId,
            json: true,
            cacheTtlSeconds: 60 * 30,
          },
        );
        narrative = res.output.narrative;
      } catch {
        narrative = null;
      }
    }

    return {
      summary,
      perConcept,
      clusters,
      behavior,
      sequence,
      misconceptions,
      narrative,
      generatedAt: new Date().toISOString(),
    };
  });

// ============================================================
// 3. Personalized next sequence (cheap, dashboard-friendly)
// ============================================================
export const getPersonalizedSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        budgetMinutes: z.number().int().min(5).max(180).optional(),
        topK: z.number().int().min(1).max(20).optional(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mastery } = await supabase
      .from("concept_mastery")
      .select(`
        micro_concept_id, mastery, confidence, streak, last_practiced_at, decay_at,
        micro_concepts:micro_concept_id (
          id, title, difficulty, estimated_minutes, tags, prerequisite_ids, concept_id
        )
      `)
      .eq("student_id", userId);

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
    if (!rows.length) return { sequence: [], generatedAt: new Date().toISOString() };

    const ids = rows.map((r) => r.microConceptId);
    const [{ data: rels }, { data: recalls }, { data: weaknesses }] = await Promise.all([
      supabase
        .from("concept_relations")
        .select("source_id, target_id, relation, weight")
        .in("source_id", ids),
      supabase
        .from("recollection_attempts")
        .select("ai_score, ai_feedback, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("weakness_profile")
        .select("micro_concept_id, weakness_tags, confidence, notes, updated_at")
        .eq("student_id", userId),
    ]);

    const sequence = personalizedSequence({
      rows,
      recentRecalls: (recalls ?? []).map((r: any) => ({
        score: Number(r.ai_score) || 0,
        feedback: r.ai_feedback ?? null,
        createdAt: r.created_at,
      })),
      weaknesses: (weaknesses ?? []).map((w: any) => ({
        microConceptId: w.micro_concept_id,
        tags: w.weakness_tags ?? [],
        confidence: Number(w.confidence) || 0,
        notes: w.notes,
        updatedAt: w.updated_at,
      })),
      edges: (rels ?? []).map((r: any) => ({
        source: r.source_id,
        target: r.target_id,
        relation: r.relation,
        weight: Number(r.weight) || 1,
      })),
      preferredMinutes: data.budgetMinutes,
      topK: data.topK ?? 8,
    });

    return { sequence, generatedAt: new Date().toISOString() };
  });
