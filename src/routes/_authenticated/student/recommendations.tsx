import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "@/lib/ai.functions";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/recommendations")({
  component: Recs,
});

function Recs() {
  const fn = useServerFn(getRecommendations);
  const { data } = useQuery({ queryKey: ["recs"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">AI recommendations</h1>
      <p className="mt-2 text-sm text-muted-foreground">Personalized next steps from your study patterns.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(data?.items ?? []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-6">
            <Sparkles className="mb-3 h-5 w-5 text-accent" />
            <div className="font-display text-base font-semibold">{r.title}</div>
            <div className="mt-2 text-sm text-muted-foreground">{r.reason}</div>
            <button className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{r.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
