import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BookOpen, HelpCircle, Wand2, Mic, MicOff } from "lucide-react";
import { z } from "zod";
import { getThread } from "@/lib/tutor.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import tutorMascot from "@/assets/tutor-mascot.png";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_authenticated/student/ai-tutor/$threadId")({
  validateSearch: searchSchema,
  component: AiTutorChat,
});

function AiTutorChat() {
  const { threadId } = Route.useParams();
  const search = useSearch({ from: Route.id });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchThread = useServerFn(getThread);

  const { data, isLoading } = useQuery({
    queryKey: ["tutor-thread", threadId],
    queryFn: () => fetchThread({ data: { id: threadId } }),
    staleTime: 0,
  });

  const initialMessages: UIMessage[] = useMemo(() => {
    if (!data?.messages) return [];
    return data.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      parts: Array.isArray(m.parts) && (m.parts as unknown[]).length > 0
        ? (m.parts as UIMessage["parts"])
        : ([{ type: "text", text: m.content }] as UIMessage["parts"]),
    }));
  }, [data?.messages]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (input, init) => {
          const { data: sess } = await supabase.auth.getSession();
          const token = sess.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["tutor-threads"] });
      qc.invalidateQueries({ queryKey: ["tutor-thread", threadId] });
    },
  });

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isLoadingChat = status === "submitted" || status === "streaming";

  // Focus textarea on mount + after thread switch + after stream completes
  useEffect(() => {
    taRef.current?.focus();
  }, [threadId, status === "ready"]);

  // Handle ?q= deep-link suggestion (sent once)
  const sentInitial = useRef<string | null>(null);
  useEffect(() => {
    const q = search.q;
    if (!q || sentInitial.current === threadId) return;
    if (initialMessages.length > 0) {
      sentInitial.current = threadId;
      return;
    }
    sentInitial.current = threadId;
    sendMessage({ text: q });
    navigate({ to: Route.fullPath, params: { threadId }, search: {}, replace: true });
  }, [search.q, initialMessages.length, threadId, sendMessage, navigate]);

  // Voice-ready: Web Speech API
  const [listening, setListening] = useState(false);
  const recogRef = useRef<unknown>(null);
  const toggleVoice = () => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input isn't supported in this browser yet.");
      return;
    }
    if (listening) {
      (recogRef.current as { stop?: () => void } | null)?.stop?.();
      setListening(false);
      return;
    }
    const r = new Ctor() as {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    r.lang = "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results).map((res) => res[0].transcript).join(" ");
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading conversation…</div>
      </div>
    );
  }
  if (!data?.thread) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <h2 className="font-display text-lg font-semibold">Conversation not found</h2>
          <p className="text-muted-foreground mt-1 text-sm">It may have been deleted.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoadingChat) return;
    sendMessage({ text });
    setInput("");
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const showQuickPrompts = messages.length === 0 && !isLoadingChat;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <img src={tutorMascot} alt="" className="h-7 w-7" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{data.thread.title}</div>
            <div className="text-muted-foreground text-[10px]">AI Tutor session</div>
          </div>
        </div>
      </header>

      {/* Conversation */}
      <Conversation className="flex-1">
        <ConversationContent>
          {showQuickPrompts && (
            <div className="mx-auto max-w-2xl py-6 text-center">
              <div className="from-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br to-purple-500/20">
                <img src={tutorMascot} alt="" className="h-10 w-10" />
              </div>
              <h2 className="font-display mt-4 text-lg font-semibold">What should we work on?</h2>
              <p className="text-muted-foreground mt-1 text-xs">Pick a starter or type your own question.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: BookOpen, label: "Explain", text: "Explain Newton's third law with everyday examples." },
                  { icon: HelpCircle, label: "Solve", text: "Solve: 2x² − 5x − 3 = 0 step by step." },
                  { icon: Wand2, label: "Quiz me", text: "Generate 5 MCQs on photosynthesis with explanations." },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => {
                        setInput(s.text);
                        requestAnimationFrame(() => taRef.current?.focus());
                      }}
                      className="hover:border-primary/40 hover:bg-primary/5 flex flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left transition"
                    >
                      <Icon className="text-primary h-4 w-4" />
                      <span className="text-xs font-semibold">{s.label}</span>
                      <span className="text-muted-foreground line-clamp-2 text-[11px]">{s.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <div className="mx-auto my-3 max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-xs text-destructive">
              Something went wrong. {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Composer */}
      <div className="border-t bg-card p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            ref={taRef}
            placeholder="Ask anything — concepts, problems, quizzes…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoadingChat}
          />
          <PromptInputFooter className="justify-between">
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition",
                listening
                  ? "border-red-500/50 bg-red-500/10 text-red-500"
                  : "hover:bg-accent text-muted-foreground",
              )}
              title="Voice input"
            >
              {listening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              {listening ? "Listening…" : "Voice"}
            </button>
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() && !isLoadingChat}
              onStop={stop}
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="text-muted-foreground mt-2 text-center text-[10px]">
          AI can make mistakes — double-check important info.
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent>
          <p className="whitespace-pre-wrap">{text}</p>
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant">
      <MessageContent>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-code:before:hidden prose-code:after:hidden">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </MessageContent>
    </Message>
  );
}
