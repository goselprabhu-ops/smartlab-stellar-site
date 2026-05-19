import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TITLE_MAX = 80;

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id, title, subject, last_message_at, created_at")
      .eq("student_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { threads: data ?? [] };
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        title: z.string().min(1).max(TITLE_MAX).optional(),
        subject: z.string().min(1).max(40).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("chat_threads")
      .insert({
        student_id: userId,
        title: data.title ?? "New chat",
        subject: data.subject ?? null,
      })
      .select("id, title, subject, last_message_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { thread: row };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(TITLE_MAX) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_threads")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("student_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("student_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const [{ data: thread, error: tErr }, { data: messages, error: mErr }] = await Promise.all([
      supabase
        .from("chat_threads")
        .select("id, title, subject, last_message_at, created_at")
        .eq("id", data.id)
        .eq("student_id", userId)
        .maybeSingle(),
      supabase
        .from("chat_messages")
        .select("id, role, content, parts, created_at")
        .eq("thread_id", data.id)
        .eq("student_id", userId)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);
    if (tErr) throw new Error(tErr.message);
    if (mErr) throw new Error(mErr.message);
    return { thread, messages: messages ?? [] };
  });
