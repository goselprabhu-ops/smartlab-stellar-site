import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-function middleware that requires the caller to have the `admin`
 * role in `public.user_roles`. Composes on top of `requireSupabaseAuth` so
 * `context.supabase`, `context.userId`, and `context.claims` are still
 * populated downstream.
 *
 * Defense in depth: RLS already restricts admin tables, but failing fast
 * here prevents accidental information disclosure (e.g. empty arrays that
 * look like "no data" to a non-admin) and gives a single audit point.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error("Forbidden");
    if (!data) throw new Error("Forbidden: admin role required");
    return next();
  });
