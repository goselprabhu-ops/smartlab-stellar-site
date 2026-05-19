import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, BookOpen, HelpCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/student/ai-tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — Smart Lab Online" }] }),
  component: AiTutorPage,
});

const prompts = [
  { icon: BookOpen, label: "Explain a concept", text: "Explain quadratic equations like I'm 12." },
  { icon: HelpCircle, label: "Solve a doubt", text: "Why does light bend when entering water?" },
  { icon: Wand2, label: "Practice with me", text: "Give me 5 MCQs on the French Revolution." },
];

interface Msg { role: "user" | "ai"; text: string }

function AiTutorPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi! I'm your Smart Lab AI tutor. Ask me to explain a topic, solve a doubt, or quiz you on anything from your syllabus." },
  ]);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "ai", text: "I'll be wired to Lovable AI in the next phase — your conversation memory and Socratic prompts are already designed." },
    ]);
    setInput("");
  }

  return (
    <div className="animate-fade-in mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <header className="space-y-2 pb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-5" />
          <span className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">AI Tutor</span>
          <Badge variant="outline" className="bg-info/15 text-info border-info/30">Beta</Badge>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Ask anything. Learn anything.</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-card p-6 elev-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={
              m.role === "user"
                ? "bg-primary text-primary-foreground max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                : "bg-muted max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm"
            }>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p.label}
            onClick={() => send(p.text)}
            className="hover-lift inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs"
          >
            <p.icon className="size-3.5 text-primary" /> {p.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="flex-1"
        />
        <Button type="submit"><Send className="size-4" /></Button>
      </form>
    </div>
  );
}
