import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";



/** Summary KPIs for the AI Control Center. */
export const aiOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from("ai_runs")
      .select("module, model, status, tokens_in, tokens_out, latency_ms, cost_cents, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    const runs = rows ?? [];
    const total = runs.length;
    const errors = runs.filter((r) => r.status === "error").length;
    const cached = runs.filter((r) => r.status === "cached").length;
    const totalCost = runs.reduce((s, r) => s + Number(r.cost_cents ?? 0), 0);
    const totalTokens = runs.reduce(
      (s, r) => s + (r.tokens_in ?? 0) + (r.tokens_out ?? 0),
      0,
    );
    const latencies = runs
      .map((r) => r.latency_ms ?? 0)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

    const byModuleMap = new Map<
      string,
      { module: string; runs: number; cost: number; errors: number }
    >();
    for (const r of runs) {
      const k = r.module;
      const cur = byModuleMap.get(k) ?? { module: k, runs: 0, cost: 0, errors: 0 };
      cur.runs += 1;
      cur.cost += Number(r.cost_cents ?? 0);
      if (r.status === "error") cur.errors += 1;
      byModuleMap.set(k, cur);
    }

    const byModelMap = new Map<string, { model: string; runs: number; cost: number }>();
    for (const r of runs) {
      const k = r.model;
      const cur = byModelMap.get(k) ?? { model: k, runs: 0, cost: 0 };
      cur.runs += 1;
      cur.cost += Number(r.cost_cents ?? 0);
      byModelMap.set(k, cur);
    }

    return {
      totalRuns: total,
      errorRate: total ? errors / total : 0,
      cacheHitRate: total ? cached / total : 0,
      totalCostCents: totalCost,
      totalTokens,
      p50Ms: p50,
      p95Ms: p95,
      byModule: Array.from(byModuleMap.values()).sort((a, b) => b.runs - a.runs),
      byModel: Array.from(byModelMap.values()).sort((a, b) => b.runs - a.runs),
    };
  });

export const aiRecentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("ai_runs")
      .select("id, module, model, status, tokens_in, tokens_out, latency_ms, cost_cents, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const aiListPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("ai_prompts")
      .select("id, module, version, template, active, created_at")
      .order("module")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const aiUpsertPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        module: z.string().min(1).max(64),
        version: z.string().min(1).max(32),
        template: z.string().min(1).max(8000),
        active: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.active) {
      await supabase
        .from("ai_prompts")
        .update({ active: false })
        .eq("module", data.module);
    }
    const { error } = await supabase
      .from("ai_prompts")
      .upsert(
        {
          module: data.module,
          version: data.version,
          template: data.template,
          active: data.active,
          created_by: userId,
        },
        { onConflict: "module,version" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const aiSetActivePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ module: z.string().min(1), promptId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    await supabase.from("ai_prompts").update({ active: false }).eq("module", data.module);
    const { error } = await supabase
      .from("ai_prompts")
      .update({ active: true })
      .eq("id", data.promptId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
