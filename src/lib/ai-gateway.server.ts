/**
 * Lovable AI Gateway — minimal server-only helper.
 * Uses the OpenAI-compatible chat/completions endpoint with JSON mode for
 * structured returns. Reads LOVABLE_API_KEY at call time.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function call(messages: ChatMessage[], opts: { model?: string; json?: boolean } = {}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached. Try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return content as string;
}

export async function aiText(messages: ChatMessage[], model?: string) {
  return call(messages, { model });
}

export async function aiJson<T = unknown>(messages: ChatMessage[], model?: string): Promise<T> {
  const raw = await call(messages, { model, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Fallback: try to extract the first JSON object substring
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI did not return valid JSON");
  }
}

export const AI_MODEL_DEFAULT = DEFAULT_MODEL;
