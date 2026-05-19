import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminMetrics, listAllUsers } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

function Admin() {
  const auth = useAuth();
  const m = useServerFn(adminMetrics);
  const u = useServerFn(listAllUsers);
  const metrics = useQuery({ queryKey: ["admin-metrics"], queryFn: () => m(), enabled: auth.hasRole("admin") });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => u(), enabled: auth.hasRole("admin") });

  if (!auth.hasRole("admin")) return <Navigate to="/dashboard" />;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Admin</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { k: "Users", v: metrics.data?.users },
          { k: "Courses", v: metrics.data?.courses },
          { k: "Quizzes", v: metrics.data?.quizzes },
          { k: "Attempts", v: metrics.data?.attempts },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.k}</div>
            <div className="mt-1 font-display text-3xl font-semibold">{s.v ?? "—"}</div>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-display text-xl font-semibold">Users</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Grade</th><th className="p-3">Roles</th></tr>
          </thead>
          <tbody>
            {(users.data ?? []).map((u) => (
              <tr key={u.user_id} className="border-t border-border">
                <td className="p-3">{u.full_name ?? "—"}</td>
                <td className="p-3">{u.grade ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{u.roles.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
