import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      school_id: z.string().uuid().optional(),
      batch_id: z.string().uuid().optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    let q = supabase.from("assignments")
      .select("id, school_id, batch_id, title, subject, due_at, status, max_score, created_at, created_by")
      .order("created_at", { ascending: false });
    if (data.school_id) q = q.eq("school_id", data.school_id);
    if (data.batch_id) q = q.eq("batch_id", data.batch_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id);
    let subsByA = new Map<string, number>();
    if (ids.length) {
      const { data: subs } = await supabase
        .from("assignment_submissions").select("assignment_id").in("assignment_id", ids);
      for (const s of subs ?? []) subsByA.set(s.assignment_id, (subsByA.get(s.assignment_id) ?? 0) + 1);
    }
    return (rows ?? []).map((r) => ({ ...r, submission_count: subsByA.get(r.id) ?? 0 }));
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      school_id: z.string().uuid(),
      batch_id: z.string().uuid(),
      title: z.string().trim().min(2).max(200),
      description_md: z.string().max(10000).optional().nullable(),
      subject: z.string().max(60).optional().nullable(),
      due_at: z.string().datetime().optional().nullable(),
      max_score: z.number().min(1).max(1000).default(100),
      status: z.enum(["draft", "published"]).default("draft"),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase.from("assignments")
      .insert({ ...data, created_by: userId }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      assignment_id: z.string().uuid(),
      status: z.enum(["draft", "published", "closed"]),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("assignments")
      .update({ status: data.status }).eq("id", data.assignment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ assignment_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: subs } = await supabase
      .from("assignment_submissions")
      .select("id, student_id, submitted_at, score, feedback, graded_at, content_md")
      .eq("assignment_id", data.assignment_id);
    const ids = Array.from(new Set((subs ?? []).map((s) => s.student_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] };
    const pByID = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return (subs ?? []).map((s) => ({ ...s, profile: pByID.get(s.student_id) ?? null }));
  });

export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      assignment_id: z.string().uuid(),
      content_md: z.string().max(20000),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("assignment_submissions")
      .upsert(
        { assignment_id: data.assignment_id, student_id: userId, content_md: data.content_md, submitted_at: new Date().toISOString() },
        { onConflict: "assignment_id,student_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      submission_id: z.string().uuid(),
      score: z.number().min(0).max(1000),
      feedback: z.string().max(2000).optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("assignment_submissions")
      .update({
        score: data.score, feedback: data.feedback ?? null,
        graded_by: userId, graded_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
