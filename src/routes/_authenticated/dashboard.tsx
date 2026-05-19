import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { hasRole, profile, roles } = useAuth();
  if (hasRole("admin")) return <Navigate to="/admin" />;
  if (hasRole("parent")) return <Navigate to="/parent" />;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Role: {roles.join(", ") || "student"}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {["Today's plan", "Smart revision", "Concept mastery"].map((t) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-6">
            <div className="font-display text-lg font-semibold">{t}</div>
            <div className="mt-2 text-sm text-muted-foreground">Coming soon — content pipeline being seeded.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
