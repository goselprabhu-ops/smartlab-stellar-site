import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider, DEFAULT_TUTOR_MODEL } from "@/lib/ai-gateway";

type ChatBody = {
  messages?: UIMessage[];
  threadId?: string;
  subject?: string | null;
};

const SYSTEM_PROMPT = `You are Smart Lab Online's AI tutor for Indian K-12 students.
- Explain concepts in clear, age-appropriate language with short paragraphs.
- Use simple analogies before introducing technical terms.
- For problems: show the approach, then the steps, then the answer.
- Generate quizzes only when asked: produce 3-5 MCQs with a one-line explanation per answer.
- When the student is stuck, ask one focused clarifying question.
- Prefer markdown: headings, bullets, and \`inline code\`/\`\`\`fenced blocks\`\`\` for math/code.
- Keep answers concise — aim for under 250 words unless the student asks for depth.`;

function partsToText(msg: UIMessage): string {
  const parts = (msg as unknown as { parts?: Array<{ type: string; text?: string }> }).parts;
  if (Array.isArray(parts)) {
    return parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("");
  }
  const flat = (msg as unknown as { content?: string }).content;
  return typeof flat === "string" ? flat : "";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // ---- Auth (server routes bypass functionMiddleware) ----
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server misconfigured", { status: 500 });
        }
        if (!LOVABLE_API_KEY) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        // ---- Body ----
        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!threadId) return new Response("Missing threadId", { status: 400 });
        if (messages.length === 0) return new Response("No messages", { status: 400 });

        // Verify thread ownership (RLS will also enforce)
        const { data: threadRow } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .eq("student_id", userId)
          .maybeSingle();
        if (!threadRow) return new Response("Thread not found", { status: 404 });

        // Persist the latest user message (idempotent-ish: only the trailing one)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          const userText = partsToText(lastUser);
          await supabase.from("chat_messages").insert({
            thread_id: threadId,
            student_id: userId,
            role: "user",
            content: userText,
            parts: lastUser.parts ?? [],
          });

          // If thread is still default title, derive one from the first user message.
          if (threadRow.title === "New chat" && userText.trim().length > 0) {
            const inferred = userText.trim().slice(0, 60).replace(/\s+/g, " ");
            await supabase
              .from("chat_threads")
              .update({ title: inferred, last_message_at: new Date().toISOString() })
              .eq("id", threadId)
              .eq("student_id", userId);
          } else {
            await supabase
              .from("chat_threads")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", threadId)
              .eq("student_id", userId);
          }
        }

        // ---- Stream ----
        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const model = gateway(DEFAULT_TUTOR_MODEL);

        const system = body.subject
          ? `${SYSTEM_PROMPT}\nCurrent subject focus: ${body.subject}.`
          : SYSTEM_PROMPT;

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            onFinish: async ({ responseMessage }) => {
              try {
                const text = partsToText(responseMessage);
                await supabase.from("chat_messages").insert({
                  thread_id: threadId,
                  student_id: userId,
                  role: "assistant",
                  content: text,
                  parts: responseMessage.parts ?? [],
                  model: DEFAULT_TUTOR_MODEL,
                });
                await supabase
                  .from("chat_threads")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", threadId)
                  .eq("student_id", userId);
              } catch (err) {
                console.error("[chat] persist assistant failed", err);
              }
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("429")) return new Response("Rate limited", { status: 429 });
          if (message.includes("402")) return new Response("AI credits exhausted", { status: 402 });
          console.error("[chat] stream error", err);
          return new Response("AI gateway error", { status: 502 });
        }
      },
    },
  },
});
