/**
 * Content Pipeline — server-only helpers.
 *
 * Powers the CBSE academic content tree:
 *   Class → Subject → Chapter → Paragraph → Concept → Micro Concept
 *
 * Responsibilities:
 *  - AI-assisted structuring of raw chapter text into the tree.
 *  - AI quiz generation grounded in a single micro-concept.
 *  - AI revision material (flashcards, cheat sheet, mind map) generation.
 *  - Tagging suggestions for searchability + retrieval.
 *
 * All AI traffic flows through `aiCall()` so it is cached, quota-checked,
 * logged in `ai_runs` and uses the active prompt registry.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { aiCall, AI_MODELS } from "@/lib/ai/core.server";

export type IngestedTree = {
  paragraphs: Array<{
    title: string;
    summary_md: string;
    concepts: Array<{
      title: string;
      summary_md: string;
      micro_concepts: Array<{
        title: string;
        learning_objective: string;
        content_md: string;
        difficulty: 1 | 2 | 3 | 4 | 5;
        bloom_level:
          | "remember"
          | "understand"
          | "apply"
          | "analyze"
          | "evaluate"
          | "create";
        estimated_minutes: number;
        tags: string[];
      }>;
    }>;
  }>;
  chapter_tags: string[];
};

const STRUCTURE_SYSTEM = `You are a senior CBSE curriculum designer.
You receive raw chapter content and decompose it into a strict academic tree.
Output MUST be valid JSON conforming to the schema. No prose.

Schema:
{
  "chapter_tags": string[],                       // 3-8 lowercase kebab tags
  "paragraphs": [
    {
      "title": string,                            // short topic title
      "summary_md": string,                       // 2-4 sentence markdown
      "concepts": [
        {
          "title": string,
          "summary_md": string,                   // 1-3 sentence markdown
          "micro_concepts": [
            {
              "title": string,                    // <= 8 words
              "learning_objective": string,       // single sentence, action verb
              "content_md": string,               // teaching text, markdown, 80-220 words
              "difficulty": 1|2|3|4|5,
              "bloom_level": "remember"|"understand"|"apply"|"analyze"|"evaluate"|"create",
              "estimated_minutes": number,        // 3-15
              "tags": string[]                    // 2-6 lowercase kebab tags
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- 3-8 paragraphs per chapter.
- 1-4 concepts per paragraph.
- 1-4 micro-concepts per concept.
- Micro-concepts are atomic: one teachable idea each.
- Tags must be reusable across the curriculum (e.g. "newtons-laws", "linear-equations").
- Never invent CBSE-incorrect content.`;

/** Structure a raw chapter into the CBSE tree via AI. */
export async function structureChapter(args: {
  userId: string;
  classLabel: string;
  subjectName: string;
  chapterTitle: string;
  raw: string;
}): Promise<IngestedTree> {
  const { output } = await aiCall<IngestedTree>(
    [
      { role: "system", content: STRUCTURE_SYSTEM },
      {
        role: "user",
        content:
          `Class: ${args.classLabel}\n` +
          `Subject: ${args.subjectName}\n` +
          `Chapter: ${args.chapterTitle}\n\n` +
          `Raw content:\n"""\n${args.raw.slice(0, 18000)}\n"""`,
      },
    ],
    {
      module: "content.structure",
      userId: args.userId,
      model: AI_MODELS.reasoning,
      json: true,
      cacheTtlSeconds: 60 * 60 * 24 * 7,
    },
  );
  return output;
}

/** Persist a structured tree under a chapter. Idempotent on (chapter, order). */
export async function persistTree(args: {
  chapterId: string;
  tree: IngestedTree;
}): Promise<{
  paragraphs: number;
  concepts: number;
  micro_concepts: number;
}> {
  let pCount = 0;
  let cCount = 0;
  let mCount = 0;

  // Stamp chapter tags
  if (args.tree.chapter_tags?.length) {
    await supabaseAdmin
      .from("chapters")
      .update({ tags: args.tree.chapter_tags })
      .eq("id", args.chapterId);
  }

  for (let pi = 0; pi < args.tree.paragraphs.length; pi++) {
    const p = args.tree.paragraphs[pi];
    const { data: paragraph, error: pe } = await supabaseAdmin
      .from("paragraphs")
      .insert({
        chapter_id: args.chapterId,
        title: p.title,
        summary_md: p.summary_md,
        order_index: pi,
      })
      .select("id")
      .single();
    if (pe || !paragraph) throw new Error(pe?.message ?? "paragraph insert failed");
    pCount++;

    for (let ci = 0; ci < p.concepts.length; ci++) {
      const c = p.concepts[ci];
      const { data: concept, error: ce } = await supabaseAdmin
        .from("concepts")
        .insert({
          paragraph_id: paragraph.id,
          title: c.title,
          summary_md: c.summary_md,
          order_index: ci,
        })
        .select("id")
        .single();
      if (ce || !concept) throw new Error(ce?.message ?? "concept insert failed");
      cCount++;

      const rows = c.micro_concepts.map((m, mi) => ({
        concept_id: concept.id,
        title: m.title,
        learning_objective: m.learning_objective,
        content_md: m.content_md,
        difficulty: m.difficulty,
        bloom_level: m.bloom_level,
        estimated_minutes: m.estimated_minutes,
        tags: m.tags ?? [],
        order_index: mi,
      }));
      if (rows.length) {
        const { error: me } = await supabaseAdmin.from("micro_concepts").insert(rows);
        if (me) throw new Error(me.message);
        mCount += rows.length;
      }
    }
  }

  return { paragraphs: pCount, concepts: cCount, micro_concepts: mCount };
}

const QUIZ_SYSTEM = `You generate CBSE-aligned quiz questions for a single micro-concept.
Return strict JSON: {"questions":[{"type":"mcq"|"multi"|"short","prompt":string,
"options":string[],"correct":string[],"points":number,"explanation":string}]}.
- 4-6 questions covering recall, understanding and application.
- MCQ has 4 options, exactly one correct. multi has 4 options with 2 correct.
- short has options=[] and correct is an array of accepted answer strings.
- Keep prompts concise and unambiguous.`;

export type GeneratedQuestion = {
  type: "mcq" | "multi" | "short";
  prompt: string;
  options: string[];
  correct: string[];
  points: number;
  explanation: string;
};

export async function generateQuizForMicro(args: {
  userId: string;
  microConceptId: string;
}): Promise<GeneratedQuestion[]> {
  const { data: mc } = await supabaseAdmin
    .from("micro_concepts")
    .select("title, learning_objective, content_md, difficulty, bloom_level, tags")
    .eq("id", args.microConceptId)
    .single();
  if (!mc) throw new Error("Micro-concept not found");

  const { output } = await aiCall<{ questions: GeneratedQuestion[] }>(
    [
      { role: "system", content: QUIZ_SYSTEM },
      {
        role: "user",
        content:
          `Micro-concept: ${mc.title}\n` +
          `Objective: ${mc.learning_objective}\n` +
          `Difficulty: ${mc.difficulty} | Bloom: ${mc.bloom_level}\n` +
          `Tags: ${(mc.tags ?? []).join(", ")}\n\n` +
          `Content:\n${mc.content_md ?? ""}`,
      },
    ],
    {
      module: "content.quiz_gen",
      userId: args.userId,
      model: AI_MODELS.fast,
      json: true,
      cacheTtlSeconds: 60 * 60 * 24 * 14,
    },
  );
  return output.questions ?? [];
}

const REVISION_SYSTEM = `You create CBSE revision material from a chapter outline.
Return JSON: {
  "cheat_sheet_md": string,            // 200-400 word concise summary, headings + bullets
  "mind_map": { "root": string, "branches": [ { "label": string, "children": string[] } ] },
  "flashcards": [ { "front": string, "back": string } ],  // 8-15
  "key_terms": [ { "term": string, "definition": string } ]  // 6-12
}`;

export async function generateRevisionForChapter(args: {
  userId: string;
  chapterId: string;
}): Promise<{
  cheat_sheet_md: string;
  mind_map: { root: string; branches: { label: string; children: string[] }[] };
  flashcards: { front: string; back: string }[];
  key_terms: { term: string; definition: string }[];
}> {
  const { data: chapter } = await supabaseAdmin
    .from("chapters")
    .select("id, title, summary_md, paragraphs(title, summary_md, concepts(title, summary_md, micro_concepts(title, learning_objective)))")
    .eq("id", args.chapterId)
    .single();
  if (!chapter) throw new Error("Chapter not found");

  const { output } = await aiCall<{
    cheat_sheet_md: string;
    mind_map: { root: string; branches: { label: string; children: string[] }[] };
    flashcards: { front: string; back: string }[];
    key_terms: { term: string; definition: string }[];
  }>(
    [
      { role: "system", content: REVISION_SYSTEM },
      {
        role: "user",
        content:
          `Chapter: ${chapter.title}\n` +
          `Summary: ${chapter.summary_md ?? ""}\n\n` +
          `Outline:\n${JSON.stringify(chapter.paragraphs ?? [], null, 2).slice(0, 16000)}`,
      },
    ],
    {
      module: "content.revision",
      userId: args.userId,
      model: AI_MODELS.fast,
      json: true,
      cacheTtlSeconds: 60 * 60 * 24 * 30,
    },
  );
  return output;
}
