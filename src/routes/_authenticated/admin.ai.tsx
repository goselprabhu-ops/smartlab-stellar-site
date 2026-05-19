import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  DollarSign,
  Zap,
  AlertTriangle,
  Database,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  aiOverview,
  aiRecentRuns,
  aiListPrompts,
  aiUpsertPrompt,
  aiSetActivePrompt,
} from "@/lib/ai-core.functions";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  component: AdminAi,
});

function fmtCost(cents: number) {
  return `$${(cents / 100).toFixed(4)}`;
}
function fmtMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}
function fmtNum(n: number) {
  return n.toLocaleString();
}

function AdminAi() {
  const overviewFn = useServerFn(aiOverview);
  const runsFn = useServerFn(aiRecentRuns);
  const promptsFn = useServerFn(aiListPrompts);

  const overview = useQuery({ queryKey: ["ai-overview"], queryFn: () => overviewFn() });
  const runs = useQuery({ queryKey: ["ai-runs"], queryFn: () => runsFn() });
  const prompts = useQuery({ queryKey: ["ai-prompts"], queryFn: () => promptsFn() });

  return (
    <section className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">AI Control Center</p>
        <h2 className="font-display text-2xl font-semibold">Monitor & tune the AI engine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Last 7 days of runs across every AI-powered feature.
        </p>
      </header>

      <KpiGrid data={overview.data} loading={overview.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ModulePanel data={overview.data?.byModule ?? []} loading={overview.isLoading} />
        <ModelPanel data={overview.data?.byModel ?? []} loading={overview.isLoading} />
      </div>

      <PromptsPanel prompts={prompts.data ?? []} loading={prompts.isLoading} />

      <RunsPanel runs={runs.data ?? []} loading={runs.isLoading} />
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 elev-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon
          className={
            tone === "warn"
              ? "size-4 text-destructive"
              : tone === "good"
              ? "size-4 text-primary"
              : "size-4 text-muted-foreground"
          }
        />
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function KpiGrid({
  data,
  loading,
}: {
  data: Awaited<ReturnType<typeof aiOverview>> | undefined;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border bg-muted/30" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi icon={Activity} label="Total runs (7d)" value={fmtNum(data.totalRuns)} />
      <Kpi
        icon={DollarSign}
        label="Spend (7d)"
        value={fmtCost(data.totalCostCents)}
        hint={`${fmtNum(data.totalTokens)} tokens`}
      />
      <Kpi
        icon={Zap}
        label="Latency P50 / P95"
        value={`${fmtMs(data.p50Ms)} / ${fmtMs(data.p95Ms)}`}
      />
      <Kpi
        icon={AlertTriangle}
        tone={data.errorRate > 0.05 ? "warn" : "default"}
        label="Error rate"
        value={`${(data.errorRate * 100).toFixed(1)}%`}
        hint={`Cache hit ${(data.cacheHitRate * 100).toFixed(0)}%`}
      />
    </div>
  );
}

function ModulePanel({
  data,
  loading,
}: {
  data: { module: string; runs: number; cost: number; errors: number }[];
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 elev-1">
      <h3 className="font-display text-sm font-semibold">By module</h3>
      <p className="mt-1 text-xs text-muted-foreground">Where compute is going.</p>
      {loading ? (
        <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted/30" />
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No runs yet.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {data.map((m) => (
            <li key={m.module} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{m.module}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{fmtNum(m.runs)} runs</span>
                <span>{fmtCost(m.cost)}</span>
                {m.errors > 0 && (
                  <Badge variant="destructive" className="h-5">
                    {m.errors} err
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModelPanel({
  data,
  loading,
}: {
  data: { model: string; runs: number; cost: number }[];
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 elev-1">
      <h3 className="font-display text-sm font-semibold">By model</h3>
      <p className="mt-1 text-xs text-muted-foreground">Routing distribution & spend.</p>
      {loading ? (
        <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted/30" />
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No runs yet.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {data.map((m) => (
            <li key={m.model} className="flex items-center justify-between py-2 text-sm">
              <span className="font-mono text-xs">{m.model}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{fmtNum(m.runs)} runs</span>
                <span>{fmtCost(m.cost)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromptsPanel({
  prompts,
  loading,
}: {
  prompts: { id: string; module: string; version: string; template: string; active: boolean; created_at: string }[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const setActiveFn = useServerFn(aiSetActivePrompt);
  const setActive = useMutation({
    mutationFn: (vars: { module: string; promptId: string }) => setActiveFn({ data: vars }),
    onSuccess: () => {
      toast.success("Active prompt updated");
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="rounded-2xl border bg-card p-5 elev-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold">Prompt registry</h3>
          <p className="mt-1 text-xs text-muted-foreground">Versioned templates per AI module.</p>
        </div>
        <NewPromptDialog />
      </div>

      {loading ? (
        <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted/30" />
      ) : prompts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No prompts registered. Add one to start versioning your AI behaviors.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Module</th>
                <th className="p-3">Version</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3 font-medium">{p.module}</td>
                  <td className="p-3 font-mono text-xs">{p.version}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.template.slice(0, 80)}
                    {p.template.length > 80 ? "…" : ""}
                  </td>
                  <td className="p-3">
                    {p.active ? (
                      <Badge className="gap-1">
                        <CheckCircle2 className="size-3" /> active
                      </Badge>
                    ) : (
                      <Badge variant="outline">inactive</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!p.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setActive.isPending}
                        onClick={() => setActive.mutate({ module: p.module, promptId: p.id })}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewPromptDialog() {
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState("");
  const [version, setVersion] = useState("");
  const [template, setTemplate] = useState("");
  const [active, setActive] = useState(false);

  const qc = useQueryClient();
  const upsertFn = useServerFn(aiUpsertPrompt);
  const upsert = useMutation({
    mutationFn: () => upsertFn({ data: { module, version, template, active } }),
    onSuccess: () => {
      toast.success("Prompt saved");
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
      setOpen(false);
      setModule("");
      setVersion("");
      setTemplate("");
      setActive(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> New prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a prompt</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="module">Module</Label>
              <Input
                id="module"
                placeholder="adaptive"
                value={module}
                onChange={(e) => setModule(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="v1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template">Template</Label>
            <Textarea
              id="template"
              rows={8}
              placeholder="You are an adaptive learning engine…"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Activate immediately (deactivates other versions in this module)
          </label>
        </div>
        <DialogFooter>
          <Button
            disabled={!module || !version || !template || upsert.isPending}
            onClick={() => upsert.mutate()}
          >
            Save prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunsPanel({
  runs,
  loading,
}: {
  runs: {
    id: string;
    module: string;
    model: string;
    status: string;
    tokens_in: number | null;
    tokens_out: number | null;
    latency_ms: number | null;
    cost_cents: number | null;
    error: string | null;
    created_at: string;
  }[];
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 elev-1">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <h3 className="font-display text-sm font-semibold">Recent runs</h3>
      </div>
      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted/30" />
      ) : runs.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No AI calls recorded yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Module</th>
                <th className="p-3">Model</th>
                <th className="p-3">Tokens</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Cost</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">{r.module}</td>
                  <td className="p-3 font-mono text-xs">{r.model}</td>
                  <td className="p-3 text-xs">
                    {(r.tokens_in ?? 0) + (r.tokens_out ?? 0)}
                  </td>
                  <td className="p-3 text-xs">{fmtMs(r.latency_ms ?? 0)}</td>
                  <td className="p-3 text-xs">{fmtCost(Number(r.cost_cents ?? 0))}</td>
                  <td className="p-3">
                    {r.status === "ok" ? (
                      <Badge variant="outline">ok</Badge>
                    ) : r.status === "cached" ? (
                      <Badge variant="secondary">cached</Badge>
                    ) : (
                      <Badge variant="destructive" title={r.error ?? ""}>
                        error
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
