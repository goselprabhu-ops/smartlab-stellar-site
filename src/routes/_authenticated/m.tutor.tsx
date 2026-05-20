import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Home, BookOpen, Sparkles, BarChart3, Bell, Send, MessageSquare } from "lucide-react";
import { MobileShell, type MobileTab } from "@/components/mobile/MobileShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TABS: MobileTab[] = [
  { to: "/m/student", label: "Home", icon: Home },
  { to: "/m/learn", label: "Learn", icon: BookOpen },
  { to: "/m/tutor", label: "Tutor", icon: Sparkles },
  { to: "/m/progress", label: "Progress", icon: BarChart3 },
  { to: "/m/inbox", label: "Inbox", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/m/tutor")({
  component: MobileTutor,
});

function MobileTutor() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const submit = async () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <MobileShell
      title="AI Tutor"
      tabs={TABS}
      right={<Link to="/student/ai-tutor" className="text-xs text-primary">Full view</Link>}
    >
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <MessageSquare className="mx-auto mb-2 size-5 text-primary" />
            <p className="text-sm font-semibold">Ask anything</p>
            <p className="mt-1 text-xs text-muted-foreground">Step-by-step help on CBSE concepts, instantly.</p>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          return (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border bg-card px-3 py-2 text-sm"
              }
            >
              {text}
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+56px)] z-30 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-md items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            rows={1}
            className="min-h-9 resize-none text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
          <Button size="icon" onClick={submit} disabled={busy || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
