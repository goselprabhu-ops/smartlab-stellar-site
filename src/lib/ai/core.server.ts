/**
 * AI Core (v1.5) — single entry point every AI module uses.
 *
 * Responsibilities:
 *  - Call Lovable AI Gateway (text or JSON).
 *  - Read versioned prompt from `ai_prompts` (active row).
 *  - Cache results in `ai_cache` by (module, input_hash).
 *  - Enforce per-user daily quota in `ai_quotas`.
 *  - Log every call to `ai_runs` (tokens, latency, cost, status).
 *
 * Server-only. Never import from client code.
 */

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_MODELS = {
  fast: "google/gemini-3-flash-preview",
  reasoning: "google/gemini-3.1-pro-preview",
  cheap: "google/gemini-3.1-flash-lite-preview",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS] | (string & {});

// Rough per-1k-token pricing in cents. Used for cost estimates in the dashboard.
// Refine as real billing data lands.
const COST_PER_1K: Record<string, { in: number; out: number }> = {
  "google/gemini-3-flash-preview": { in: 0.0075, out: 0.03 },
  "google/gemini-3.1-flash-lite-preview": { in: 0.004, out: 0.015 },
  "google/gemini-3.1-pro-preview": { in: 0.125, out: 0.5 },
  "google/gemini-2.5-flash": { in: 0.0075, out: 0.03 },
  "google/gemini-2.5-pro": { in: 0.125, out: 0.5 },
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type CallOptions = {
  module: string;
  userId?: string | null;
  model?: AiModel;
  json?: boolean;
  /** Cache TTL in seconds. 0 / undefined disables cache. */
  cacheTtlSeconds?: number;
  /** Used for prompt registry lookup. Overrides any prompt resolved from DB. */
  promptVersion?: string;
};

export type CallResult<T = string> = {
  output: T;
  cached: boolean;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costCents: number;
};

function sha(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = COST_PER_1K[model];
  if (!p) return 0;
  return (tokensIn / 1000) * p.in + (tokensOut / 1000) * p.out;
}

/** Fetch the active prompt template for a module. Returns null if none. */
export async function getActivePrompt(
  module: string,
): Promise<{ version: string; template: string } | null> {
  const { data } = await supabaseAdmin
    .from("ai_prompts")
    .select("version, template")
    .eq("module", module)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Check + increment daily quota. Throws if exceeded. */
async function consumeQuota(userId: string, module: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseAdmin
    .from("ai_quotas")
    .select("used, daily_limit")
    .eq("user_id", userId)
    .eq("module", module)
    .eq("period_start", today)
    .maybeSingle();

  if (existing) {
    if (existing.used >= existing.daily_limit) {
      throw new Error(`Daily AI quota reached for ${module}. Try again tomorrow.`);
    }
    await supabaseAdmin
      .from("ai_quotas")
      .update({ used: existing.used + 1 })
      .eq("user_id", userId)
      .eq("module", module)
      .eq("period_start", today);
  } else {
    await supabaseAdmin
      .from("ai_quotas")
      .insert({ user_id: userId, module, period_start: today, used: 1 });
  }
}

async function logRun(row: {
  userId?: string | null;
  module: string;
  model: string;
  promptVersion?: string | null;
  inputHash: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costCents: number;
  status: "ok" | "error" | "cached";
  error?: string | null;
}): Promise<void> {
  await supabaseAdmin.from("ai_runs").insert({
    user_id: row.userId ?? null,
    module: row.module,
    model: row.model,
    prompt_version: row.promptVersion ?? null,
    input_hash: row.inputHash,
    tokens_in: row.tokensIn,
    tokens_out: row.tokensOut,
    latency_ms: row.latencyMs,
    cost_cents: row.costCents,
    status: row.status,
    error: row.error ?? null,
  });
}

/**
 * Core call. Handles cache → quota → gateway → log.
 * Returns parsed JSON when `json: true`, else string.
 */
export async function aiCall<T = string>(
  messages: ChatMessage[],
  opts: CallOptions,
): Promise<CallResult<T>> {
  const model = opts.model ?? AI_MODELS.fast;
  const inputHash = sha({ messages, model, json: !!opts.json });
  const started = Date.now();

  // 1. Cache lookup
  if (opts.cacheTtlSeconds && opts.cacheTtlSeconds > 0) {
    const { data: cached } = await supabaseAdmin
      .from("ai_cache")
      .select("output, model, expires_at")
      .eq("module", opts.module)
      .eq("input_hash", inputHash)
      .maybeSingle();
    if (cached && (!cached.expires_at || new Date(cached.expires_at) > new Date())) {
      await logRun({
        userId: opts.userId,
        module: opts.module,
        model: cached.model ?? model,
        inputHash,
        tokensIn: 0,
        tokensOut: 0,
        latencyMs: Date.now() - started,
        costCents: 0,
        status: "cached",
      });
      return {
        output: cached.output as T,
        cached: true,
        model: cached.model ?? model,
        tokensIn: 0,
        tokensOut: 0,
        latencyMs: Date.now() - started,
        costCents: 0,
      };
    }
  }

  // 2. Quota
  if (opts.userId) await consumeQuota(opts.userId, opts.module);

  // 3. Gateway call
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const tokensIn: number = data?.usage?.prompt_tokens ?? 0;
    const tokensOut: number = data?.usage?.completion_tokens ?? 0;
    const costCents = estimateCost(model, tokensIn, tokensOut);
    const latencyMs = Date.now() - started;

    let output: unknown = content;
    if (opts.json) {
      try {
        output = JSON.parse(content);
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) throw new Error("AI did not return valid JSON");
        output = JSON.parse(m[0]);
      }
    }

    // 4. Cache
    if (opts.cacheTtlSeconds && opts.cacheTtlSeconds > 0) {
      const expiresAt = new Date(Date.now() + opts.cacheTtlSeconds * 1000).toISOString();
      await supabaseAdmin.from("ai_cache").upsert({
        module: opts.module,
        input_hash: inputHash,
        output: output as object,
        model,
        expires_at: expiresAt,
      });
    }

    // 5. Log
    await logRun({
      userId: opts.userId,
      module: opts.module,
      model,
      promptVersion: opts.promptVersion ?? null,
      inputHash,
      tokensIn,
      tokensOut,
      latencyMs,
      costCents,
      status: "ok",
    });

    return { output: output as T, cached: false, model, tokensIn, tokensOut, latencyMs, costCents };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logRun({
      userId: opts.userId,
      module: opts.module,
      model,
      inputHash,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - started,
      costCents: 0,
      status: "error",
      error: message,
    });
    throw err;
  }
}
