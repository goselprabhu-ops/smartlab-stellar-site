import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Crown, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/student/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Smart Lab Online" }] }),
  component: LeaderboardPage,
});

const rows = [
  { rank: 1, name: "Aanya R.", grade: 9, xp: 4820, streak: 41 },
  { rank: 2, name: "Kabir M.", grade: 9, xp: 4710, streak: 33 },
  { rank: 3, name: "Ishaan T.", grade: 9, xp: 4655, streak: 27 },
  { rank: 4, name: "You",      grade: 9, xp: 4310, streak: 12, isMe: true },
  { rank: 5, name: "Diya S.",  grade: 9, xp: 4188, streak: 18 },
  { rank: 6, name: "Arjun P.", grade: 9, xp: 4012, streak: 9 },
  { rank: 7, name: "Meera K.", grade: 9, xp: 3970, streak: 22 },
];

function LeaderboardPage() {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="space-y-2">
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-primary">Leaderboard</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Friendly competition keeps you sharp</h1>
        <p className="text-muted-foreground">Rankings refresh hourly. XP comes from mastery gains, streaks, and quiz wins.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Crown, label: "Your rank", value: "#4", hint: "Top 2% in Class 9" },
          { icon: TrendingUp, label: "XP this week", value: "+420", hint: "Up 18%" },
          { icon: Flame, label: "Streak", value: "12 days", hint: "Personal best" },
        ].map((s) => (
          <div key={s.label} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <s.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl font-semibold">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="class">
        <TabsList>
          <TabsTrigger value="class">Class</TabsTrigger>
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
        </TabsList>

        {["class", "school", "global"].map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <div className="overflow-hidden rounded-2xl border bg-card elev-2">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3 w-16">Rank</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3 text-right">XP</th>
                    <th className="p-3 text-right">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rank} className={r.isMe ? "bg-primary/5 font-medium" : "border-t"}>
                      <td className="p-3">
                        {r.rank <= 3 ? <Trophy className="size-4 text-warning" /> : <span className="text-muted-foreground">#{r.rank}</span>}
                      </td>
                      <td className="p-3">{r.name}</td>
                      <td className="p-3 text-muted-foreground">Class {r.grade}</td>
                      <td className="p-3 text-right font-mono">{r.xp.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{r.streak}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
