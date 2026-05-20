import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { narrateSchoolInsights, type SchoolSnapshot } from "@/lib/ai/school-insights.server";

async function buildSnapshot(supabase: any, schoolId: string): Promise<SchoolSnapshot> {
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [school, members, batches] = await Promise.all([
    supabase.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    supabase.from("school_members").select("user_id, role").eq("school_id", schoolId).eq("status", "active"),
    supabase.from("batches").select("id, name").eq("school_id", schoolId),
  ]);
  const batchIds = (batches.data ?? []).map((b: any) => b.id);
  const studentIds = (members.data ?? []).filter((m: any) => m.role === "student").map((m: any) => m.user_id);
  const [att, asg, masteryRows] = await Promise.all([
    batchIds.length
      ? supabase.from("attendance_records").select("status, batch_id").in("batch_id", batchIds).gte("date", since30)
      : Promise.resolve({ data: [] }),
    supabase.from("assignments").select("id, status, batch_id").eq("school_id", schoolId),
    studentIds.length
      ? supabase.from("concept_mastery").select("student_id, mastery").in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const attRows = att.data ?? [];
  const presentN = attRows.filter((r: any) => r.status === "present" || r.status === "late").length;
  const attPct = attRows.length ? Math.round((presentN / attRows.length) * 100) : null;
  const masteryByStudent = new Map<string, number[]>();
  for (const m of masteryRows.data ?? []) {
    const arr = masteryByStudent.get(m.student_id) ?? [];
    arr.push(Number(m.mastery) || 0);
    masteryByStudent.set(m.student_id, arr);
  }
  const studentAvg = Array.from(masteryByStudent.values()).map(
    (xs) => xs.reduce((a, b) => a + b, 0) / xs.length,
  );
  const avgMastery = studentAvg.length
    ? Math.round((studentAvg.reduce((a, b) => a + b, 0) / studentAvg.length) * 100)
    : null;
  const atRiskCount = studentAvg.filter((x) => x < 0.4).length;
  const published = (asg.data ?? []).filter((a: any) => a.status === "published");
  const asgIds = published.map((a: any) => a.id);
  let submissionRatePct: number | null = null;
  if (asgIds.length && studentIds.length) {
    const { data: subs } = await supabase
      .from("assignment_submissions").select("assignment_id").in("assignment_id", asgIds);
    const denom = asgIds.length * studentIds.length;
    submissionRatePct = denom ? Math.round(((subs?.length ?? 0) / denom) * 100) : null;
  }
  return {
    schoolName: school.data?.name ?? "School",
    students: studentIds.length,
    teachers: (members.data ?? []).filter((m: any) => m.role === "teacher").length,
    batches: batchIds.length,
    attendance30dPct: attPct,
    avgMasteryPct: avgMastery,
    assignmentsPublished: published.length,
    submissionRatePct,
    topBatches: [],
    atRiskCount,
  };
}

export const generateSchoolInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const snapshot = await buildSnapshot(supabase, data.school_id);
    const payload = await narrateSchoolInsights(snapshot);
    const { error } = await supabase.from("school_insights").insert({
      school_id: data.school_id, period: "week", payload, model: "google/gemini-2.5-flash",
    });
    if (error) throw new Error(error.message);
    return payload;
  });

export const getLatestSchoolInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("school_insights")
      .select("payload, generated_at, model")
      .eq("school_id", data.school_id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row;
  });
