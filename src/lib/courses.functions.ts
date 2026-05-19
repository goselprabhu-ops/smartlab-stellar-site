import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { courseSchema, lessonSchema } from "./schemas";

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subjects")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("*, subjects(name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const [course, lessons, quizzes] = await Promise.all([
      context.supabase
        .from("courses")
        .select("*, subjects(name, slug)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("lessons")
        .select("*")
        .eq("course_id", data.id)
        .order("order_index"),
      context.supabase
        .from("quizzes")
        .select("id, title, time_limit_seconds, lesson_id")
        .eq("course_id", data.id),
    ]);
    if (course.error) throw new Error(course.error.message);
    return {
      course: course.data,
      lessons: lessons.data ?? [],
      quizzes: quizzes.data ?? [],
    };
  });

export const upsertSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(100),
        slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
        icon: z.string().max(50).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("subjects")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => courseSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("courses")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => lessonSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("lessons")
      .upsert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
