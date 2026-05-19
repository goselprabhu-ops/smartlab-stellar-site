import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAllUsers } from "@/lib/admin.functions";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const u = useServerFn(listAllUsers);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => u() });
  const [q, setQ] = useState("");

  const filtered = (users.data ?? []).filter((row) =>
    (row.full_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">User management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Search, filter, and manage roles for every account.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="w-64 pl-9" />
          </div>
          <Button><UserPlus className="size-4" /> Invite</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Roles</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.user_id} className="border-t">
                <td className="p-3">{row.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{row.grade ?? "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {row.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-sm text-muted-foreground">No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
