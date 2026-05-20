import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy, Flame, Crown, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeaderboard } from "@/lib/gamification.functions";

export const Route = createFileRoute("/_authenticated/student/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Smart Lab Online" }] }),
  component: LeaderboardPage,
});

type Scope = "global" | "grade" | "class";
type Period = "day" | "week" | "month" | "all";

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const [scope, setScope] = useState<Scope>("grade");
  const [period, setPeriod] = useState<Period>("week");
  const q = useQuery({
    queryKey: ["leaderboard", scope, period],
    queryFn: () => fn({ data: { scope, period, limit: 30 } }),
  });

  const rows = q.data?.rows ?? [];
  const me = q.data?.me;

  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Leaderboard</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Friendly competition keeps you sharp</h1>
        <p className="text-muted-foreground">XP comes from study minutes, recall accuracy, quiz wins, streaks, and challenges.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Crown} label="Your rank" value={me ? `#${me.rank}` : "—"} hint={me ? `Top in ${scope}` : "Earn XP to rank"} />
        <Stat icon={TrendingUp} label={`XP (${period})`} value={me ? `+${me.xp.toLocaleString()}` : "0"} hint="Period total" />
        <Stat icon={Flame} label="Streak" value={me ? `${me.streak} days` : "0d"} hint="Daily activity" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList>
            <TabsTrigger value="grade">My grade</TabsTrigger>
            <TabsTrigger value="class">My class</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {(["day", "week", "month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-soft ${
                period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {p === "all" ? "All time" : p}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={scope}>
        {(["grade", "class", "global"] as Scope[]).map((k) => (
          <TabsContent key={k} value={k} className="mt-2">
            <div className="overflow-hidden rounded-2xl border bg-card elev-2">
              {q.isLoading ? (
                <div className="flex items-center gap-2 p-8 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading ranks…
                </div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No-one has earned XP in this scope yet.{" "}
                  <Link to="/student/engagement" className="text-primary hover:underline">
                    Start a challenge
                  </Link>{" "}
                  to be first.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-16 p-3">Rank</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3 text-right">XP ({period})</th>
                      <th className="p-3 text-right">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.studentId} className={r.isMe ? "bg-primary/5 font-medium" : "border-t"}>
                        <td className="p-3">
                          {r.rank <= 3 ? (
                            <Trophy className={`size-4 ${r.rank === 1 ? "text-warning" : r.rank === 2 ? "text-muted-foreground" : "text-primary"}`} />
                          ) : (
                            <span className="text-muted-foreground">#{r.rank}</span>
                          )}
                        </td>
                        <td className="p-3">{r.isMe ? "You" : r.name}</td>
                        <td className="p-3 text-muted-foreground">{r.grade ? `Class ${r.grade}` : "—"}</td>
                        <td className="p-3 text-right font-mono">{r.xp.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono">{r.streak}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">How XP is earned</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Study minutes, recall accuracy, quiz wins, mastery gains, streak milestones, daily-goal hits, and smart challenges all add XP. Names are masked to protect privacy.
        </p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <div className="hover-lift rounded-2xl border bg-card p-5 elev-2">
      <Icon className="mb-3 size-5 text-primary" />
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
