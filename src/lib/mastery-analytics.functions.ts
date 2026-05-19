/**
 * Mastery analytics — student-facing learning intelligence.
 *
 * Aggregates rolling signals (concept_mastery, recollection_attempts,
 * evaluation_attempts, weakness_profile, learning_sessions) into a single
 * payload for the Mastery Dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLearningIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ studentId: z.string().uuid().optional() }).optional().parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data?.studentId ?? userId;

    const [{ data: mastery }, { data: sessions }, { data: recalls }, { data: evals }, { data: weak }] =
      await Promise.all([
        supabase
          .from("concept_mastery")
          .select(`
            mastery, confidence, streak, decay_at, last_practiced_at, micro_concept_id,
            micro_concepts:micro_concept_id ( title, estimated_minutes, difficulty, bloom_level )
          `)
          .eq("student_id", target),
        supabase
          .from("learning_sessions")
          .select("state, attempts, mastery, micro_concept_id, updated_at")
          .eq("student_id", target),
        supabase
          .from("recollection_attempts")
          .select("ai_score, created_at")
          .eq("student_id", target)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("evaluation_attempts")
          .select("score, total, created_at")
          .eq("student_id", target)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("weakness_profile")
          .select(`
            weakness_tags, confidence, notes, updated_at, micro_concept_id,
            micro_concepts:micro_concept_id ( title )
          `)
          .eq("student_id", target)
          .order("updated_at", { ascending: false }),
      ]);

    const masteryRows = mastery ?? [];
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

    const avgMastery = avg(masteryRows.map((r: any) => Number(r.mastery)));
    const avgConfidence = avg(masteryRows.map((r: any) => Number(r.confidence)));
    const avgRecall = avg((recalls ?? []).map((r: any) => Number(r.ai_score ?? 0)));
    const avgEval = avg(
      (evals ?? []).map((r: any) => (r.total ? Number(r.score) / Number(r.total) : 0)),
    );

    // Retention: closer decay_at = more at-risk. Strength = % of concepts not due.
    const now = Date.now();
    const dueSoon = masteryRows.filter(
      (r: any) => r.decay_at && new Date(r.decay_at).getTime() <= now,
    ).length;
    const retention = masteryRows.length
      ? 1 - dueSoon / masteryRows.length
      : 0;

    // Effort proxy: sum(attempts × estimated_minutes)
    const sessionsByMc = new Map<string, number>();
    for (const s of sessions ?? []) {
      sessionsByMc.set(s.micro_concept_id, (sessionsByMc.get(s.micro_concept_id) ?? 0) + (s.attempts ?? 0));
    }
    const totalMinutes = masteryRows.reduce((sum: number, r: any) => {
      const att = sessionsByMc.get(r.micro_concept_id) ?? 0;
      const est = r.micro_concepts?.estimated_minutes ?? 8;
      return sum + att * est;
    }, 0);

    // Mastery bands
    const bands = { mastered: 0, proficient: 0, developing: 0, weak: 0 };
    for (const r of masteryRows) {
      const m = Number(r.mastery);
      if (m >= 0.85) bands.mastered++;
      else if (m >= 0.6) bands.proficient++;
      else if (m >= 0.35) bands.developing++;
      else bands.weak++;
    }

    // Weakness clusters: tag frequency
    const tagFreq = new Map<string, number>();
    for (const w of weak ?? []) {
      for (const tag of (w.weakness_tags ?? []) as string[]) {
        tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1);
      }
    }
    const clusters = Array.from(tagFreq.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent trend: rolling avg of last 10 recall+eval samples (chronological)
    const recent = [
      ...((recalls ?? []) as any[]).map((r) => ({ t: r.created_at, v: Number(r.ai_score ?? 0) })),
      ...((evals ?? []) as any[]).map((r) => ({
        t: r.created_at,
        v: r.total ? Number(r.score) / Number(r.total) : 0,
      })),
    ]
      .sort((a, b) => +new Date(a.t) - +new Date(b.t))
      .slice(-14);

    const topStrengths = [...masteryRows]
      .sort((a: any, b: any) => Number(b.mastery) - Number(a.mastery))
      .slice(0, 5)
      .map((r: any) => ({
        microConceptId: r.micro_concept_id,
        title: r.micro_concepts?.title ?? "—",
        mastery: Number(r.mastery),
        streak: r.streak,
      }));

    const topWeak = [...masteryRows]
      .sort((a: any, b: any) => Number(a.mastery) - Number(b.mastery))
      .slice(0, 5)
      .map((r: any) => ({
        microConceptId: r.micro_concept_id,
        title: r.micro_concepts?.title ?? "—",
        mastery: Number(r.mastery),
      }));

    return {
      summary: {
        trackedConcepts: masteryRows.length,
        avgMastery,
        avgConfidence,
        avgRecall,
        avgEval,
        retention,
        totalMinutes,
        dueSoon,
      },
      bands,
      clusters,
      trend: recent,
      topStrengths,
      topWeak,
      weaknesses: (weak ?? []).slice(0, 10).map((w: any) => ({
        microConceptId: w.micro_concept_id,
        title: w.micro_concepts?.title ?? "—",
        tags: w.weakness_tags ?? [],
        notes: w.notes,
        updatedAt: w.updated_at,
      })),
    };
  });
