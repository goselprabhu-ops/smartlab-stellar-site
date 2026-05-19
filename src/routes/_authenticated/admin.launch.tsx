import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Rocket, CheckCircle2, Circle, AlertCircle, Loader2, Users, CalendarCheck, ListChecks } from "lucide-react";
import { toast } from "sonner";

import {
  adminListChecklist,
  adminUpdateChecklistItem,
  adminListWaitlist,
  adminListDemoRequests,
  adminUpdateLaunchConfig,
  getLaunchConfig,
} from "@/lib/launch.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/launch")({
  component: AdminLaunchPage,
});

type Checklist = Awaited<ReturnType<typeof adminListChecklist>>;
type Waitlist = Awaited<ReturnType<typeof adminListWaitlist>>;
type Demos = Awaited<ReturnType<typeof adminListDemoRequests>>;
type Config = Awaited<ReturnType<typeof getLaunchConfig>>;

const STATUS_ICON = {
  todo: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
  blocked: AlertCircle,
} as const;

function AdminLaunchPage() {
  const fetchChecklist = useServerFn(adminListChecklist);
  const fetchWaitlist = useServerFn(adminListWaitlist);
  const fetchDemos = useServerFn(adminListDemoRequests);
  const fetchConfig = useServerFn(getLaunchConfig);
  const updateItem = useServerFn(adminUpdateChecklistItem);
  const updateConfig = useServerFn(adminUpdateLaunchConfig);

  const [checklist, setChecklist] = useState<Checklist>([]);
  const [waitlist, setWaitlist] = useState<Waitlist>([]);
  const [demos, setDemos] = useState<Demos>([]);
  const [config, setConfig] = useState<Config | null>(null);

  async function refresh() {
    const [c, w, d, cfg] = await Promise.all([
      fetchChecklist({ data: undefined as never }),
      fetchWaitlist({ data: {} }),
      fetchDemos({ data: undefined as never }),
      fetchConfig({ data: undefined as never }),
    ]);
    setChecklist(c);
    setWaitlist(w);
    setDemos(d);
    setConfig(cfg);
  }

  useEffect(() => {
    refresh().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const total = checklist.length;
  const done = checklist.filter((c) => c.status === "done").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Launch control</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Version 1 launch</h2>
          <p className="text-sm text-muted-foreground">
            Checklist, demo mode, waitlist, and live signups in one console.
          </p>
        </div>
        <div className="rounded-2xl border bg-card px-5 py-3 elev-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Launch readiness</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{progress}%</p>
        </div>
      </header>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile icon={Users} label="Waitlist signups" value={waitlist.length} />
        <KpiTile icon={CalendarCheck} label="Demo requests" value={demos.length} />
        <KpiTile icon={ListChecks} label="Checklist items done" value={`${done}/${total}`} />
      </div>

      {/* Config */}
      {config ? (
        <section className="rounded-2xl border bg-card p-6 elev-1">
          <h3 className="font-display text-lg font-semibold">Launch configuration</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Launch date</Label>
              <Input
                type="datetime-local"
                defaultValue={config.launch_at ? new Date(config.launch_at).toISOString().slice(0, 16) : ""}
                onBlur={async (e) => {
                  const v = e.target.value ? new Date(e.target.value).toISOString() : null;
                  await updateConfig({ data: { launchAt: v } });
                  toast.success("Launch date saved");
                }}
              />
            </div>
            <ToggleField
              label="Waitlist open"
              defaultChecked={config.waitlist_open}
              onChange={async (v) => {
                await updateConfig({ data: { waitlistOpen: v } });
                toast.success(v ? "Waitlist opened" : "Waitlist closed");
              }}
            />
            <ToggleField
              label="Demo mode (public)"
              defaultChecked={config.demo_mode_enabled}
              onChange={async (v) => {
                await updateConfig({ data: { demoModeEnabled: v } });
                toast.success(v ? "Demo mode on" : "Demo mode off");
              }}
            />
            <div className="space-y-2">
              <Label>Referral reward</Label>
              <Input
                defaultValue={config.referral_reward ?? ""}
                onBlur={async (e) => {
                  await updateConfig({ data: { referralReward: e.target.value } });
                  toast.success("Referral reward saved");
                }}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Checklist */}
      <section className="rounded-2xl border bg-card p-6 elev-1">
        <div className="mb-4 flex items-center gap-2">
          <Rocket className="size-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Launch checklist</h3>
        </div>
        <div className="divide-y">
          {checklist.map((item) => {
            const Icon = STATUS_ICON[item.status as keyof typeof STATUS_ICON] ?? Circle;
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Icon className={`size-4 ${item.status === "done" ? "text-success" : item.status === "blocked" ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                </div>
                <Select
                  defaultValue={item.status}
                  onValueChange={async (v) => {
                    await updateItem({ data: { id: item.id, status: v as never } });
                    setChecklist((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: v } : x)));
                  }}
                >
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent signups */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 elev-1">
          <h3 className="font-display text-lg font-semibold">Recent waitlist signups</h3>
          <div className="mt-4 space-y-2 text-sm">
            {waitlist.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-none">
                <div>
                  <p className="font-medium">{w.name ?? w.email}</p>
                  <p className="text-xs text-muted-foreground">{w.email} · Class {w.grade ?? "—"} · {w.role}</p>
                </div>
                <Badge variant="outline">{w.status}</Badge>
              </div>
            ))}
            {waitlist.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signups yet.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 elev-1">
          <h3 className="font-display text-lg font-semibold">Recent demo requests</h3>
          <div className="mt-4 space-y-2 text-sm">
            {demos.slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-none">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.email} · {d.role} · {d.preferred_date ?? "no date"}
                  </p>
                </div>
                <Badge variant="outline">{d.status}</Badge>
              </div>
            ))}
            {demos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No demo requests yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 elev-1">
      <Icon className="size-5 text-primary" />
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ToggleField({
  label,
  defaultChecked,
  onChange,
}: {
  label: string;
  defaultChecked: boolean;
  onChange: (v: boolean) => void | Promise<void>;
}) {
  const [v, setV] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3">
      <Label className="text-sm">{label}</Label>
      <Switch
        checked={v}
        onCheckedChange={(c) => {
          setV(c);
          onChange(c);
        }}
      />
    </div>
  );
}
