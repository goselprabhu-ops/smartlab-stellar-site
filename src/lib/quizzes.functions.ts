import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { questionSchema, quizSchema, submitAttemptSchema } from "./schemas";

export const listQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quizzes")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const [quiz, questions] = await Promise.all([
      context.supabase
        .from("quizzes")
        .select("*, courses(id, title)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quiz_questions")
        .select("id, prompt, type, options, points, order_index")
        .eq("quiz_id", data.id)
        .order("order_index"),
    ]);
    if (quiz.error) throw new Error(quiz.error.message);
    return { quiz: quiz.data, questions: questions.data ?? [] };
  });

export const upsertQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => quizSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("quizzes")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => questionSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("quiz_questions")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("quiz_questions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => submitAttemptSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Server-side scoring: fetch correct answers
    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, type, correct, points")
      .eq("quiz_id", data.quiz_id);
    if (qErr) throw new Error(qErr.message);

    let score = 0;
    let total = 0;
    for (const q of questions ?? []) {
      total += q.points;
      const given = data.answers[q.id];
      const correctArr = Array.isArray(q.correct) ? q.correct : [];
      const normalized = (v: unknown): string =>
        typeof v === "string" ? v.trim().toLowerCase() : String(v ?? "").trim().toLowerCase();

      if (q.type === "mcq" || q.type === "short") {
        if (
          given !== undefined &&
          !Array.isArray(given) &&
          correctArr.some((c) => normalized(c) === normalized(given))
        ) {
          score += q.points;
        }
      } else if (q.type === "multi") {
        if (Array.isArray(given)) {
          const g = given.map(normalized).sort();
          const c = correctArr.map(normalized).sort();
          if (g.length === c.length && g.every((v, i) => v === c[i])) {
            score += q.points;
          }
        }
      }
    }

    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: data.quiz_id,
        student_id: userId,
        score,
        total,
        answers: data.answers,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { attempt, score, total };
  });

export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_attempts")
      .select("*, quizzes(title, course_id, courses(title))")
      .order("submitted_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
