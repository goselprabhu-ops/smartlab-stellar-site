import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMySchools, listSchoolMembers } from "@/lib/schools.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/school/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const listFn = useServerFn(listMySchools);
  const membersFn = useServerFn(listSchoolMembers);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const members = useQuery({
    queryKey: ["school-members", school?.id],
    queryFn: () => membersFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  if (!school) return null;
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 elev-1">
        <h2 className="mb-3 font-display text-lg font-semibold">School profile</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Name</dt><dd>{school.name}</dd></div>
          <div><dt className="text-muted-foreground">Board</dt><dd>{school.board ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">City</dt><dd>{school.city ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Plan</dt><dd className="capitalize">{school.plan}</dd></div>
        </dl>
      </div>

      <div className="rounded-2xl border bg-card p-6 elev-1">
        <h2 className="mb-3 font-display text-lg font-semibold">Members</h2>
        <div className="space-y-2">
          {(members.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div className="text-sm">{m.profile?.full_name ?? m.user_id.slice(0, 8)}</div>
              <Badge variant="secondary">{m.role}</Badge>
            </div>
          ))}
          {members.data && !members.data.length && (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
