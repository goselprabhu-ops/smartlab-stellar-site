import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/lib/auth.functions";
import type { Session } from "@supabase/supabase-js";

export type Role = "student" | "parent" | "teacher" | "admin" | "school_admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMe);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      qc.invalidateQueries({ queryKey: ["me"] });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const me = useQuery({
    queryKey: ["me", session?.user?.id ?? null],
    queryFn: () => fetchMe(),
    enabled: !!session?.user,
    staleTime: 60_000,
  });

  const roles = (me.data?.roles ?? []) as Role[];

  return {
    ready: ready && (!session?.user || !me.isLoading),
    session,
    user: session?.user ?? null,
    profile: me.data?.profile ?? null,
    roles,
    hasRole: (r: Role) => roles.includes(r),
    hasAnyRole: (rs: Role[]) => rs.some((r) => roles.includes(r)),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}
