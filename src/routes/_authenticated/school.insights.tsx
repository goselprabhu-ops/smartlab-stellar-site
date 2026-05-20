import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { listMySchools } from "@/lib/schools.functions";
import { getLatestSchoolInsights, generateSchoolInsights } from "@/lib/school-insights.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const listFn = useServerFn(listMySchools);
  const insightsFn = useServerFn(getLatestSchoolInsights);
  const regenFn = useServerFn(generateSchoolInsights);
  const schools = useQuery({ queryKey: ["my-schools"], queryFn: () => listFn() });
  const school = schools.data?.[0];
  const insights = useQuery({
    queryKey: ["school-insights", school?.id],
    queryFn: () => insightsFn({ data: { school_id: school!.id } }),
    enabled: !!school,
  });
  const regen = useMutation({
    mutationFn: () => regenFn({ data: { school_id: school!.id } }),
    onSuccess: () => { toast.success("Insights refreshed"); insights.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const p = insights.data?.payload as any;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">AI weekly brief</h2>
        </div>
        <Button onClick={() => regen.mutate()} disabled={regen.isPending}>
          {regen.isPending ? "Generating…" : "Regenerate"}
        </Button>
      </div>
      {!p && <p className="text-sm text-muted-foreground">No brief yet — click Regenerate.</p>}
      {p && (
        <div className="space-y-4 rounded-2xl border bg-card p-6 elev-1">
          <p className="font-display text-2xl">{p.headline}</p>
          <p className="text-sm text-muted-foreground">{p.summary}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(["highlights", "risks", "actions"] as const).map((k) => (
              <div key={k} className="rounded-xl border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
                <ul className="space-y-1 text-sm">
                  {(p[k] ?? []).map((item: string, i: number) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
