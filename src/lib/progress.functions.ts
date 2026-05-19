import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const recordProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        lesson_id: z.string().uuid(),
        mastery: z.number().min(0).max(100).default(100),
        completed: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("progress").upsert(
      {
        student_id: userId,
        lesson_id: data.lesson_id,
        mastery: data.mastery,
        completed_at: data.completed ? new Date().toISOString() : null,
      },
      { onConflict: "student_id,lesson_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("progress")
      .select("*, lessons(title, course_id, courses(title))")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getStudentProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ student_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Authorization: caller must be the student, an admin, or a linked parent.
    if (data.student_id !== userId) {
      const [{ data: isAdmin }, { data: link }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(),
        supabase
          .from("parent_student_links")
          .select("id")
          .eq("parent_id", userId)
          .eq("student_id", data.student_id)
          .maybeSingle(),
      ]);
      if (!isAdmin && !link) throw new Error("Forbidden");
    }

    const [progress, attempts] = await Promise.all([
      supabase
        .from("progress")
        .select("*, lessons(title, course_id, courses(title))")
        .eq("student_id", data.student_id),
      supabase
        .from("quiz_attempts")
        .select("*, quizzes(title)")
        .eq("student_id", data.student_id)
        .order("submitted_at", { ascending: false })
        .limit(20),
    ]);
    return {
      progress: progress.data ?? [],
      attempts: attempts.data ?? [],
    };
  });


export const listLinkedStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", userId);
    const ids = (links ?? []).map((l) => l.student_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, grade, school");
    return (profiles ?? []).filter((p) => ids.includes(p.user_id));
  });
