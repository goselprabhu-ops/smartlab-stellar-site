import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_TUTOR_MODEL } from "@/lib/ai-gateway";

const testKindSchema = z.enum(["chapter", "micro", "full_mock", "ai", "diagnostic"]);

export const listTests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: testKindSchema.optional(),
        subjectId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
        search: z.string().trim().max(120).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("quizzes")
      .select(
        "id, title, description, kind, difficulty, time_limit_seconds, class_id, subject_id, chapter_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(60);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.subjectId) q = q.eq("subject_id", data.subjectId);
    if (data.classId) q = q.eq("class_id", data.classId);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    if (ids.length === 0) return { tests: [] };

    const { data: counts } = await context.supabase
      .from("quiz_questions")
      .select("quiz_id")
      .in("quiz_id", ids);
    const countMap = new Map<string, number>();
    for (const c of counts ?? []) {
      countMap.set(c.quiz_id, (countMap.get(c.quiz_id) ?? 0) + 1);
    }
    return {
      tests: (rows ?? []).map((r) => ({
        ...r,
        question_count: countMap.get(r.id) ?? 0,
      })),
    };
  });

export const getTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const [{ data: quiz, error: qe }, { data: questions, error: qqe }] = await Promise.all([
      context.supabase
        .from("quizzes")
        .select(
          "id, title, description, kind, difficulty, time_limit_seconds, class_id, subject_id, chapter_id",
        )
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quiz_questions")
        .select("id, prompt, type, options, points, order_index")
        .eq("quiz_id", data.id)
        .order("order_index"),
    ]);
    if (qe) throw new Error(qe.message);
    if (qqe) throw new Error(qqe.message);
    if (!quiz) throw new Error("Test not found");
    return { quiz, questions: questions ?? [] };
  });

export const getAttemptResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total, answers, submitted_at, student_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!attempt || attempt.student_id !== userId) throw new Error("Attempt not found");

    const [{ data: quiz }, { data: questions }] = await Promise.all([
      supabase
        .from("quizzes")
        .select("id, title, kind, difficulty, time_limit_seconds, subject_id, chapter_id")
        .eq("id", attempt.quiz_id)
        .maybeSingle(),
      supabase
        .from("quiz_questions")
        .select("id, prompt, type, options, correct, points, order_index")
        .eq("quiz_id", attempt.quiz_id)
        .order("order_index"),
    ]);

    const normalize = (v: unknown) =>
      typeof v === "string" ? v.trim().toLowerCase() : String(v ?? "").trim().toLowerCase();
    const answers = (attempt.answers ?? {}) as Record<string, string | string[]>;
    const review = (questions ?? []).map((q) => {
      const given = answers[q.id];
      const correctArr = Array.isArray(q.correct) ? (q.correct as unknown[]) : [];
      let isCorrect = false;
      if (q.type === "multi" && Array.isArray(given)) {
        const g = given.map(normalize).sort();
        const c = correctArr.map(normalize).sort();
        isCorrect = g.length === c.length && g.every((v, i) => v === c[i]);
      } else if (given !== undefined && !Array.isArray(given)) {
        isCorrect = correctArr.some((c) => normalize(c) === normalize(given));
      }
      return {
        id: q.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        points: q.points,
        correct: correctArr as (string | number)[],
        given: given ?? null,
        isCorrect,
      };
    });

    // Simple weak-area detection: bottom 30% of question-tags placeholder = use difficulty bucket
    const wrong = review.filter((r) => !r.isCorrect).map((r) => r.prompt.slice(0, 60));

    return { attempt, quiz, review, weakAreas: wrong.slice(0, 5) };
  });

export const getTestLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ quizId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("quiz_attempts")
      .select("id, score, total, submitted_at, student_id, profiles:student_id(full_name)")
      .eq("quiz_id", data.quizId)
      .order("score", { ascending: false })
      .limit(20);
    if (error) {
      // profiles join may fail RLS for non-admins; fall back without names
      const { data: bare } = await context.supabase
        .from("quiz_attempts")
        .select("id, score, total, submitted_at, student_id")
        .eq("quiz_id", data.quizId)
        .order("score", { ascending: false })
        .limit(20);
      return {
        rows: (bare ?? []).map((r, i) => ({
          rank: i + 1,
          name: r.student_id === context.userId ? "You" : `Student ${r.student_id.slice(0, 4)}`,
          score: r.score,
          total: r.total,
          isMe: r.student_id === context.userId,
        })),
      };
    }
    return {
      rows: (rows ?? []).map((r, i) => {
        const profile = (r as unknown as { profiles?: { full_name?: string } | null }).profiles;
        return {
          rank: i + 1,
          name:
            r.student_id === context.userId
              ? "You"
              : profile?.full_name ?? `Student ${r.student_id.slice(0, 4)}`,
          score: Number(r.score),
          total: Number(r.total),
          isMe: r.student_id === context.userId,
        };
      }),
    };
  });

export const getMyTestStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("quiz_attempts")
      .select("score, total, submitted_at, quizzes(title, kind, subject_id)")
      .eq("student_id", context.userId)
      .order("submitted_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const totals = list.reduce(
      (acc, r) => {
        acc.score += Number(r.score);
        acc.total += Number(r.total);
        return acc;
      },
      { score: 0, total: 0 },
    );
    const accuracy = totals.total ? Math.round((totals.score / totals.total) * 100) : 0;
    const trend = list
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({
        i,
        pct: r.total > 0 ? Math.round((Number(r.score) / Number(r.total)) * 100) : 0,
      }));
    const weakSubjects = new Map<string, { wrong: number; total: number }>();
    for (const r of list) {
      const key = (r.quizzes as unknown as { subject_id?: string } | null)?.subject_id ?? "general";
      const cur = weakSubjects.get(key) ?? { wrong: 0, total: 0 };
      cur.total += Number(r.total);
      cur.wrong += Number(r.total) - Number(r.score);
      weakSubjects.set(key, cur);
    }
    return {
      taken: list.length,
      accuracy,
      lastScore: list[0] ? Math.round((Number(list[0].score) / Math.max(1, Number(list[0].total))) * 100) : null,
      trend,
      recent: list.slice(0, 6).map((r) => ({
        title: (r.quizzes as unknown as { title?: string } | null)?.title ?? "Test",
        kind: (r.quizzes as unknown as { kind?: string } | null)?.kind ?? "chapter",
        score: Number(r.score),
        total: Number(r.total),
        submitted_at: r.submitted_at,
      })),
    };
  });

// AI question generation
const aiQuestionSchema = z.object({
  prompt: z.string().min(5).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(5),
  correctIndex: z.number().int().min(0).max(4),
  explanation: z.string().max(400).optional(),
});

export const generateAiTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        topic: z.string().trim().min(2).max(120),
        subjectId: z.string().uuid().optional(),
        chapterId: z.string().uuid().optional(),
        count: z.number().int().min(3).max(15).default(8),
        difficulty: z.number().int().min(1).max(5).default(2),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");
    const provider = createLovableAiGatewayProvider(key);
    const model = provider(DEFAULT_TUTOR_MODEL);

    const { object } = await generateObject({
      model,
      schema: z.object({ questions: z.array(aiQuestionSchema).min(3).max(15) }),
      prompt: `Generate ${data.count} CBSE-aligned multiple-choice questions on "${data.topic}". Difficulty level ${data.difficulty} of 5 (1=easy, 5=hard). Each question must have exactly 4 options, exactly one correct, and a one-sentence explanation. Use clear, school-appropriate language.`,
    });

    const { supabase, userId } = context;
    const { data: quiz, error: qe } = await supabase
      .from("quizzes")
      .insert({
        title: `AI Test · ${data.topic}`,
        description: `Generated for difficulty ${data.difficulty}/5`,
        kind: "ai",
        difficulty: data.difficulty,
        subject_id: data.subjectId ?? null,
        chapter_id: data.chapterId ?? null,
        time_limit_seconds: data.count * 60,
        published: false,
        created_by: userId,
      })
      .select("id")
      .single();
    if (qe || !quiz) throw new Error(qe?.message ?? "Failed to create test");

    const rows = object.questions.map((q, i) => ({
      quiz_id: quiz.id,
      prompt: q.prompt,
      type: "mcq" as const,
      options: q.options,
      correct: [q.options[q.correctIndex] ?? q.options[0]],
      points: 1,
      order_index: i,
    }));
    const { error: insErr } = await supabase.from("quiz_questions").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { quizId: quiz.id, count: rows.length };
  });
