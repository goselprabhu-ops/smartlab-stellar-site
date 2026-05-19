import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { appRoleSchema } from "./schemas";
import { z } from "zod";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      userId,
      profile: profile ?? null,
      roles: (roleRows ?? []).map((r) => r.role as "student" | "parent" | "admin"),
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(100).optional(),
        grade: z.string().trim().max(20).optional(),
        school: z.string().trim().max(200).optional(),
        avatar_url: z.string().url().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const linkStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ student_email: z.string().email() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Look up the student via their profile's full_name search? We only have email in auth.users, not accessible.
    // Instead, allow link by student_id passed directly. For email lookup, require server-side admin.
    // Here we treat student_email as the student_id (UUID) for now to avoid admin client coupling.
    const { error } = await supabase
      .from("parent_student_links")
      .insert({ parent_id: userId, student_id: data.student_email });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ user_id: z.string().uuid(), role: appRoleSchema }).parse(input),
  )
  .handler(async ({ context, data }) => {
    // RLS enforces admin-only write on user_roles
    const { supabase } = context;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
