import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STATUSES = ["present", "absent", "late", "excused"] as const;

export const getBatchAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      batch_id: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: roster } = await supabase
      .from("batch_students").select("student_id, roll_no").eq("batch_id", data.batch_id);
    const ids = (roster ?? []).map((r) => r.student_id);
    const [profiles, records] = await Promise.all([
      ids.length
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
        : Promise.resolve({ data: [] }),
      supabase.from("attendance_records").select("student_id, status, note")
        .eq("batch_id", data.batch_id).eq("date", data.date),
    ]);
    const pByID = new Map(((profiles as { data: Array<{ user_id: string; full_name: string | null }> }).data ?? []).map((p) => [p.user_id, p]));
    const rByID = new Map((records.data ?? []).map((r) => [r.student_id, r]));
    return (roster ?? []).map((r) => ({
      student_id: r.student_id,
      roll_no: r.roll_no,
      name: pByID.get(r.student_id)?.full_name ?? "Student",
      status: rByID.get(r.student_id)?.status ?? null,
      note: rByID.get(r.student_id)?.note ?? null,
    }));
  });

export const markBatchAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      batch_id: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      records: z.array(
        z.object({
          student_id: z.string().uuid(),
          status: z.enum(STATUSES),
          note: z.string().max(280).optional().nullable(),
        }),
      ).min(1).max(200),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const rows = data.records.map((r) => ({
      batch_id: data.batch_id, date: data.date, marked_by: userId,
      student_id: r.student_id, status: r.status, note: r.note ?? null,
    }));
    const { error } = await supabase
      .from("attendance_records")
      .upsert(rows, { onConflict: "batch_id,student_id,date" });
    if (error) throw new Error(error.message);
    return { ok: true, saved: rows.length };
  });

export const getStudentAttendanceSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      student_id: z.string().uuid(),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const from = data.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const to = data.to ?? new Date().toISOString().slice(0, 10);
    const { data: rows } = await supabase
      .from("attendance_records")
      .select("date, status")
      .eq("student_id", data.student_id)
      .gte("date", from).lte("date", to);
    const total = rows?.length ?? 0;
    const present = (rows ?? []).filter((r) => r.status === "present" || r.status === "late").length;
    return {
      from, to, total, present,
      pct: total ? Math.round((present / total) * 100) : null,
      rows: rows ?? [],
    };
  });
