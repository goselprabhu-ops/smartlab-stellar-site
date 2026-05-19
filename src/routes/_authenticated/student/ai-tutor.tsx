import { createFileRoute, Outlet, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, MessageSquare, Trash2, BrainCircuit, Loader2 } from "lucide-react";
import { listThreads, createThread, deleteThread } from "@/lib/tutor.functions";
import { cn } from "@/lib/utils";
import tutorMascot from "@/assets/tutor-mascot.png";

export const Route = createFileRoute("/_authenticated/student/ai-tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — Smart Lab Online" },
      { name: "description", content: "Chat with your AI tutor — explanations, doubt solving, quiz generation, and study help, with full session history." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AiTutorLayout,
});

function AiTutorLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchThreads = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);

  const { data, isLoading } = useQuery({
    queryKey: ["tutor-threads"],
    queryFn: () => fetchThreads(),
    staleTime: 30_000,
  });

  const newChat = useMutation({
    mutationFn: () => createFn({ data: {} }),
    onSuccess: async ({ thread }) => {
      await qc.invalidateQueries({ queryKey: ["tutor-threads"] });
      navigate({ to: "/student/ai-tutor/$threadId", params: { threadId: thread.id } });
    },
  });

  const removeChat = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-threads"] }),
  });

  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  return (
    <div className="animate-fade-in grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="bg-card hidden flex-col overflow-hidden rounded-2xl border elev-2 lg:flex">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="from-primary flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br to-purple-500 shadow-md">
              <img src={tutorMascot} alt="" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold">AI Tutor</div>
              <div className="text-muted-foreground text-[10px]">Always-on learning</div>
            </div>
          </div>
          <button
            onClick={() => newChat.mutate()}
            disabled={newChat.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50"
            title="New chat"
          >
            {newChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-muted-foreground p-4 text-center text-xs">Loading…</div>
          ) : (data?.threads.length ?? 0) === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              No chats yet — start a new one.
            </div>
          ) : (
            <ul className="space-y-1">
              {data!.threads.map((t) => (
                <li key={t.id} className="group relative">
                  <Link
                    to="/student/ai-tutor/$threadId"
                    params={{ threadId: t.id }}
                    className={cn(
                      "hover:bg-accent flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition",
                      activeId === t.id && "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <MessageSquare className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{t.title}</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm("Delete this chat?")) {
                        removeChat.mutate(t.id);
                        if (activeId === t.id) navigate({ to: "/student/ai-tutor" });
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded p-1 group-hover:block"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-muted-foreground border-t p-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="h-3 w-3" /> Powered by Lovable AI
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl border elev-2">
        <Outlet />
      </main>
    </div>
  );
}
