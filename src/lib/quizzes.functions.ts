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

    // Server-side scoring via SECURITY DEFINER RPC (answer keys never leave the DB).
    const { data: scored, error: scoreErr } = await supabase.rpc("score_quiz_attempt", {
      _quiz_id: data.quiz_id,
      _answers: data.answers,
    });
    if (scoreErr) throw new Error(scoreErr.message);
    const row = Array.isArray(scored) ? scored[0] : scored;
    const score = Number(row?.score ?? 0);
    const total = Number(row?.total ?? 0);

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
