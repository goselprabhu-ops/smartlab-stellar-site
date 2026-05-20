import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
  "school";

export const listMySchools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships } = await supabase
      .from("school_members")
      .select("school_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active");
    const ids = (memberships ?? []).map((m) => m.school_id);
    if (!ids.length) return [];
    const { data: schools } = await supabase
      .from("schools")
      .select("id, name, slug, board, city, plan, logo_url, active, created_at")
      .in("id", ids);
    const roleByID = new Map((memberships ?? []).map((m) => [m.school_id, m.role]));
    return (schools ?? []).map((s) => ({ ...s, my_role: roleByID.get(s.id) ?? null }));
  });

export const createSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      board: z.string().trim().max(40).optional(),
      city: z.string().trim().max(80).optional(),
      plan: z.enum(["free", "pro", "enterprise"]).default("free"),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("schools").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const { data: school, error } = await supabase
      .from("schools")
      .insert({
        name: data.name, slug, board: data.board, city: data.city,
        plan: data.plan, created_by: userId,
      })
      .select("*").single();
    if (error) throw new Error(error.message);
    const { error: memErr } = await supabase
      .from("school_members")
      .insert({ school_id: school.id, user_id: userId, role: "school_admin" });
    if (memErr) throw new Error(memErr.message);
    return school;
  });

export const getSchoolOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const today = new Date().toISOString().slice(0, 10);
    const [school, members, batches, assignmentsToday, att] = await Promise.all([
      supabase.from("schools").select("*").eq("id", data.school_id).maybeSingle(),
      supabase.from("school_members").select("user_id, role").eq("school_id", data.school_id).eq("status", "active"),
      supabase.from("batches").select("id, name, grade, section, class_teacher_id, active").eq("school_id", data.school_id),
      supabase.from("assignments").select("id, status").eq("school_id", data.school_id).eq("status", "published"),
      supabase.from("attendance_records").select("status, batch_id").eq("date", today)
        .in("batch_id", (await supabase.from("batches").select("id").eq("school_id", data.school_id)).data?.map((b) => b.id) ?? ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const roleCounts = { school_admin: 0, teacher: 0, student: 0, parent: 0 } as Record<string, number>;
    for (const m of members.data ?? []) roleCounts[m.role] = (roleCounts[m.role] ?? 0) + 1;
    const attRows = att.data ?? [];
    const presentCount = attRows.filter((r) => r.status === "present" || r.status === "late").length;
    const attPct = attRows.length ? Math.round((presentCount / attRows.length) * 100) : null;
    return {
      school: school.data,
      counts: {
        students: roleCounts.student,
        teachers: roleCounts.teacher,
        admins: roleCounts.school_admin,
        parents: roleCounts.parent,
        batches: (batches.data ?? []).length,
        activeAssignments: (assignmentsToday.data ?? []).length,
        attendanceTodayPct: attPct,
        attendanceTodayMarked: attRows.length,
      },
      batches: batches.data ?? [],
    };
  });

export const listSchoolMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: members } = await supabase
      .from("school_members")
      .select("id, user_id, role, status, joined_at")
      .eq("school_id", data.school_id);
    const ids = Array.from(new Set((members ?? []).map((m) => m.user_id)));
    if (!ids.length) return [];
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name, grade, avatar_url").in("user_id", ids);
    const byID = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return (members ?? []).map((m) => ({ ...m, profile: byID.get(m.user_id) ?? null }));
  });

export const addMemberByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      school_id: z.string().uuid(),
      user_id: z.string().uuid(),
      role: z.enum(["school_admin", "teacher", "student", "parent"]),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("school_members")
      .insert({ school_id: data.school_id, user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: batches, error } = await supabase
      .from("batches")
      .select("id, name, grade, section, academic_year, class_teacher_id, active, created_at")
      .eq("school_id", data.school_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (batches ?? []).map((b) => b.id);
    if (!ids.length) return [];
    const { data: roster } = await supabase
      .from("batch_students").select("batch_id").in("batch_id", ids);
    const counts = new Map<string, number>();
    for (const r of roster ?? []) counts.set(r.batch_id, (counts.get(r.batch_id) ?? 0) + 1);
    return (batches ?? []).map((b) => ({ ...b, student_count: counts.get(b.id) ?? 0 }));
  });

export const createBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      school_id: z.string().uuid(),
      name: z.string().trim().min(1).max(80),
      grade: z.string().trim().max(20).optional(),
      section: z.string().trim().max(20).optional(),
      academic_year: z.string().trim().max(20).optional(),
      class_teacher_id: z.string().uuid().optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("batches").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getBatchDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ batch_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: batch } = await supabase.from("batches").select("*").eq("id", data.batch_id).maybeSingle();
    const { data: roster } = await supabase
      .from("batch_students").select("student_id, roll_no, joined_at").eq("batch_id", data.batch_id);
    const ids = (roster ?? []).map((r) => r.student_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name, grade, avatar_url").in("user_id", ids)
      : { data: [] as Array<{ user_id: string; full_name: string | null; grade: string | null; avatar_url: string | null }> };
    const pByID = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return {
      batch,
      roster: (roster ?? []).map((r) => ({ ...r, profile: pByID.get(r.student_id) ?? null })),
    };
  });

export const addStudentsToBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      batch_id: z.string().uuid(),
      student_ids: z.array(z.string().uuid()).min(1).max(200),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const rows = data.student_ids.map((id) => ({ batch_id: data.batch_id, student_id: id }));
    const { error } = await supabase.from("batch_students").upsert(rows, { onConflict: "batch_id,student_id" });
    if (error) throw new Error(error.message);
    return { ok: true, added: rows.length };
  });

export const removeStudentFromBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ batch_id: z.string().uuid(), student_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("batch_students")
      .delete().eq("batch_id", data.batch_id).eq("student_id", data.student_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSchoolStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: members } = await supabase
      .from("school_members")
      .select("user_id, joined_at")
      .eq("school_id", data.school_id)
      .eq("role", "student")
      .eq("status", "active");
    const ids = (members ?? []).map((m) => m.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name, grade, avatar_url").in("user_id", ids);
    const pByID = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return (members ?? []).map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      profile: pByID.get(m.user_id) ?? null,
    }));
  });

export const listSchoolTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ school_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: members } = await supabase
      .from("school_members")
      .select("user_id, joined_at, role")
      .eq("school_id", data.school_id)
      .in("role", ["teacher", "school_admin"])
      .eq("status", "active");
    const ids = (members ?? []).map((m) => m.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
    const pByID = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const { data: batches } = await supabase
      .from("batches").select("id, name, class_teacher_id").eq("school_id", data.school_id);
    const batchByTeacher = new Map<string, Array<{ id: string; name: string }>>();
    for (const b of batches ?? []) {
      if (!b.class_teacher_id) continue;
      const arr = batchByTeacher.get(b.class_teacher_id) ?? [];
      arr.push({ id: b.id, name: b.name });
      batchByTeacher.set(b.class_teacher_id, arr);
    }
    return (members ?? []).map((m) => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      profile: pByID.get(m.user_id) ?? null,
      batches: batchByTeacher.get(m.user_id) ?? [],
    }));
  });
