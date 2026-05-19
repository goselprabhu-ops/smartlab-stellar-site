/**
 * AI Remediation Engine — full personalized support pipeline.
 *
 * On trigger: pulls weakness diagnosis + related micro-concepts via the
 * knowledge graph, then generates a complete remediation pack:
 *   - simplified notes        (plain-language re-write)
 *   - concept summary         (1-paragraph + bullet TL;DR)
 *   - flashcards              (Q/A pairs for SM-2 style review)
 *   - practice MCQs           (4-option, 1 correct)
 *   - revision sheet          (1-page cheatsheet markdown)
 *   - micro test              (timed mixed-format quiz)
 *   - visual explanation      (textual description + SVG-able prompt)
 *
 * All outputs persist to ai_generated_material so the loop, dashboards,
 * and parent views can replay them.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJson, AI_MODEL_DEFAULT } from "./ai-gateway.server";

// ----------------------- schemas -----------------------
const PackSchema = z.object({
  simplifiedNotes: z.string().min(10),
  summary: z.object({
    paragraph: z.string(),
    bullets: z.array(z.string()).min(3).max(8),
  }),
  flashcards: z
    .array(z.object({ front: z.string(), back: z.string(), hint: z.string().optional() }))
    .min(4)
    .max(12),
  mcqs: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
      }),
    )
    .min(4)
    .max(8),
  revisionSheet: z.string().min(40),
  microTest: z.object({
    durationMinutes: z.number().int().min(2).max(20),
    items: z
      .array(
        z.object({
          prompt: z.string(),
          type: z.enum(["mcq", "short", "true_false"]),
          options: z.array(z.string()).optional(),
          answer: z.string(),
        }),
      )
      .min(3)
      .max(8),
  }),
  visualExplanation: z.object({
    description: z.string(),
    imagePrompt: z.string(),
    asciiOrMermaid: z.string().optional(),
  }),
  revisionStrategy: z.object({
    nextSessionInMinutes: z.number().int().min(5),
    suggestedCadence: z.string(),
    focusTags: z.array(z.string()).default([]),
  }),
});
type RemediationPack = z.infer<typeof PackSchema>;

// ----------------------- helpers -----------------------
async function loadContext(supabase: any, userId: string, microConceptId: string) {
  const { data: mc, error: mcErr } = await supabase
    .from("micro_concepts")
    .select(
      "id, title, learning_objective, content_md, difficulty, bloom_level, tags, concept_id",
    )
    .eq("id", microConceptId)
    .single();
  if (mcErr || !mc) throw new Error("Micro-concept not found");

  const { data: session } = await supabase
    .from("learning_sessions")
    .select("id, state, attempts, mastery")
    .eq("student_id", userId)
    .eq("micro_concept_id", microConceptId)
    .maybeSingle();

  if (!session) {
    const { data: created, error } = await supabase
      .from("learning_sessions")
      .insert({ student_id: userId, micro_concept_id: microConceptId, state: "remediating" })
      .select("id, state, attempts, mastery")
      .single();
    if (error) throw new Error(error.message);
    Object.assign((session as any) ?? {}, created);
    return { mc, session: created };
  }

  const { data: weakness } = await supabase
    .from("weakness_profile")
    .select("weakness_tags, notes, confidence")
    .eq("student_id", userId)
    .eq("micro_concept_id", microConceptId)
    .maybeSingle();

  const { data: relations } = await supabase
    .from("concept_relations")
    .select("relation, target_id, weight, micro_concepts:target_id ( id, title, learning_objective )")
    .eq("source_id", microConceptId)
    .order("weight", { ascending: false })
    .limit(6);

  const { data: lastRecall } = await supabase
    .from("recollection_attempts")
    .select("ai_score, ai_feedback")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastEval } = await supabase
    .from("evaluation_attempts")
    .select("score, total, per_question")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { mc, session, weakness, relations: relations ?? [], lastRecall, lastEval };
}

// ----------------------- main pipeline -----------------------
export const runRemediationPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, userId, data.microConceptId);
    const { mc, session, weakness, relations, lastRecall, lastEval } = ctx;

    const pack = await aiJson<RemediationPack>(
      [
        {
          role: "system",
          content:
            "You are a personalised tutor producing a complete remediation pack for ONE micro-concept. " +
            "Use the student's diagnosed weaknesses and recent recall/eval signals to target gaps. " +
            "Language must be simpler than the canonical content. Return STRICT JSON matching the schema. " +
            "Schema: { simplifiedNotes: string, summary:{paragraph,bullets[3-8]}, " +
            "flashcards[4-12]:{front,back,hint?}, mcqs[4-8]:{prompt,options[4],correctIndex,explanation}, " +
            "revisionSheet:string (markdown cheatsheet), " +
            "microTest:{durationMinutes,items[3-8]:{prompt,type:mcq|short|true_false,options?,answer}}, " +
            "visualExplanation:{description,imagePrompt,asciiOrMermaid?}, " +
            "revisionStrategy:{nextSessionInMinutes,suggestedCadence,focusTags[]} }.",
        },
        {
          role: "user",
          content: JSON.stringify({
            microConcept: {
              title: mc.title,
              objective: mc.learning_objective,
              content: mc.content_md,
              difficulty: mc.difficulty,
              bloom: mc.bloom_level,
              tags: mc.tags,
            },
            relatedConcepts: relations.map((r: any) => ({
              relation: r.relation,
              title: r.micro_concepts?.title,
              objective: r.micro_concepts?.learning_objective,
            })),
            weaknessTags: weakness?.weakness_tags ?? [],
            weaknessNotes: weakness?.notes ?? "",
            lastRecallScore: lastRecall?.ai_score ?? null,
            lastRecallFeedback: lastRecall?.ai_feedback ?? null,
            lastEvalScore:
              lastEval && lastEval.total > 0 ? Number(lastEval.score) / Number(lastEval.total) : null,
            sessionAttempts: session.attempts ?? 0,
          }),
        },
      ],
      AI_MODEL_DEFAULT,
    );
    const parsed = PackSchema.parse(pack);

    const rows = [
      { kind: "simplified_notes" as const, payload: { text: parsed.simplifiedNotes } },
      { kind: "summary" as const, payload: parsed.summary },
      { kind: "flashcards" as const, payload: { items: parsed.flashcards } },
      { kind: "mcq" as const, payload: { items: parsed.mcqs } },
      { kind: "revision_sheet" as const, payload: { markdown: parsed.revisionSheet } },
      { kind: "micro_test" as const, payload: parsed.microTest },
      { kind: "visual_explanation" as const, payload: parsed.visualExplanation },
    ].map((r) => ({
      session_id: session.id,
      student_id: userId,
      kind: r.kind,
      payload: r.payload,
      model: AI_MODEL_DEFAULT,
    }));

    const { error: insErr } = await supabase.from("ai_generated_material").insert(rows);
    if (insErr) throw new Error(insErr.message);

    // Tighten the decay schedule so the engine resurfaces this concept soon
    const nextAt = new Date(
      Date.now() + parsed.revisionStrategy.nextSessionInMinutes * 60 * 1000,
    ).toISOString();
    await supabase
      .from("concept_mastery")
      .upsert(
        {
          student_id: userId,
          micro_concept_id: data.microConceptId,
          decay_at: nextAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,micro_concept_id" },
      );

    await supabase
      .from("learning_sessions")
      .update({ state: "remediating", last_event_at: new Date().toISOString() })
      .eq("id", session.id);

    return {
      sessionId: session.id,
      pack: parsed,
      related: relations.map((r: any) => ({
        id: r.target_id,
        title: r.micro_concepts?.title ?? "—",
        relation: r.relation,
      })),
    };
  });

// ----------------------- read latest pack -----------------------
export const getRemediationPack = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ microConceptId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mc } = await supabase
      .from("micro_concepts")
      .select("id, title, learning_objective")
      .eq("id", data.microConceptId)
      .single();

    const { data: session } = await supabase
      .from("learning_sessions")
      .select("id")
      .eq("student_id", userId)
      .eq("micro_concept_id", data.microConceptId)
      .maybeSingle();

    if (!session) return { microConcept: mc, items: [] };

    const { data: items } = await supabase
      .from("ai_generated_material")
      .select("id, kind, payload, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false });

    const { data: relations } = await supabase
      .from("concept_relations")
      .select("relation, target_id, weight, micro_concepts:target_id ( id, title )")
      .eq("source_id", data.microConceptId)
      .order("weight", { ascending: false })
      .limit(6);

    return {
      microConcept: mc,
      items: items ?? [],
      related: (relations ?? []).map((r: any) => ({
        id: r.target_id,
        title: r.micro_concepts?.title ?? "—",
        relation: r.relation,
      })),
    };
  });
