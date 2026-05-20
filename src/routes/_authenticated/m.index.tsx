import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/m/")({
  component: MobileEntry,
});

function MobileEntry() {
  const { ready, hasRole } = useAuth();
  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (hasRole("admin") || hasRole("teacher")) return <Navigate to="/m/teacher" />;
  if (hasRole("parent")) return <Navigate to="/m/parent" />;
  return <Navigate to="/m/student" />;
}
