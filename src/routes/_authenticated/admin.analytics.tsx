import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, Users, Activity, Clock, Download, Sparkles, Brain, BookOpen, MessageSquare,
} from "lucide-react";
import { getAdminAnalytics } from "@/lib/analytics.functions";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

const pct = (x: number) => `${Math.round((x || 0) * 100)}%`;
const BAND_COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(var(--destructive))"];

function AdminAnalytics() {
  const fn = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn() });

  const insights = useMemo(() => {
    if (!data) return [];
    const out: string[] = [];
    const latest = data.weeks.at(-1);
    const prev = data.weeks.at(-2);
    if (latest && prev && prev.attempts > 0) {
      const delta = ((latest.attempts - prev.attempts) / prev.attempts) * 100;
      out.push(`${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% weekly attempts vs last week.`);
    }
    out.push(`${data.kpis.students} active students across ${data.kpis.subjectsCount} subjects.`);
    out.push(`${pct(data.kpis.completionRate)} of learning sessions completed in 30 days.`);
    const top = [...data.subjectEffectiveness].sort((a, b) => b.accuracy - a.accuracy)[0];
    if (top) out.push(`Highest accuracy: ${top.name} (${pct(top.accuracy)}).`);
    const low = [...data.subjectEffectiveness].filter((s) => s.attempts >= 5).sort((a, b) => a.accuracy - b.accuracy)[0];
    if (low) out.push(`Lowest accuracy: ${low.name} (${pct(low.accuracy)}) — review difficulty curve.`);
    return out;
  }, [data]);

  const downloadCsv = () => {
    if (!data) return;
    const rows = [
      "Platform Analytics",
      `Generated,${new Date().toISOString()}`,
      "",
      "KPI,Value",
      `Users,${data.kpis.users}`,
      `Students,${data.kpis.students}`,
      `Attempts (30d),${data.kpis.attempts30d}`,
      `Sessions (30d),${data.kpis.sessions30d}`,
      `Chat messages (30d),${data.kpis.chatMessages30d}`,
      `Completion rate,${pct(data.kpis.completionRate)}`,
      `Avg mastery,${pct(data.kpis.avgPlatformMastery)}`,
      "",
      "Week,Attempts,Active students",
      ...data.weeks.map((w) => `${w.week},${w.attempts},${w.activeStudents}`),
      "",
      "Subject,Accuracy,Attempts",
      ...data.subjectEffectiveness.map((s) => `${s.name},${pct(s.accuracy)},${s.attempts}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) return <LoadingState />;

  const bandsData = [
    { name: "Mastered", value: data.bands.mastered },
    { name: "Proficient", value: data.bands.proficient },
    { name: "Developing", value: data.bands.developing },
    { name: "Weak", value: data.bands.weak },
  ];

  const kpis = [
    { icon: Users, label: "Students", value: data.kpis.students.toLocaleString(), hint: `${data.kpis.users} total users` },
    { icon: Activity, label: "Attempts (30d)", value: data.kpis.attempts30d.toLocaleString(), hint: "quiz + tests" },
    { icon: Clock, label: "Sessions (30d)", value: data.kpis.sessions30d.toLocaleString(), hint: `${pct(data.kpis.completionRate)} completed` },
    { icon: MessageSquare, label: "AI messages (30d)", value: data.kpis.chatMessages30d.toLocaleString(), hint: "tutor usage" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Platform analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">Engagement, learning effectiveness, and AI signals across the platform.</p>
        </div>
        <Button onClick={downloadCsv} variant="outline" size="sm" className="gap-2">
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="hover-lift rounded-2xl border bg-card p-5 elev-2">
            <k.icon className="text-primary mb-3 size-5" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
            <div className="font-display text-3xl font-semibold">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold">Engagement · last 12 weeks</h3>
          <p className="mb-4 text-xs text-muted-foreground">Quiz attempts and active students</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeks}>
                <defs>
                  <linearGradient id="adG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="attempts" stroke="hsl(var(--primary))" fill="url(#adG)" name="Attempts" />
                <Area type="monotone" dataKey="activeStudents" stroke="hsl(142 76% 36%)" fillOpacity={0} name="Active students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 elev-2">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">Mastery distribution</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bandsData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {bandsData.map((_, i) => <Cell key={i} fill={BAND_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Avg platform mastery: <span className="font-mono font-medium text-foreground">{pct(data.kpis.avgPlatformMastery)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">Learning effectiveness by subject</h3>
          </div>
          {data.subjectEffectiveness.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subject-tagged attempts yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectEffectiveness.map((s) => ({ ...s, accuracyPct: Math.round(s.accuracy * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="accuracyPct" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Accuracy %" />
                  <Bar dataKey="attempts" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} name="Attempts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 elev-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">AI insights</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {insights.map((i) => <li key={i}>· {i}</li>)}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-lg border bg-card p-3 text-xs text-muted-foreground">
            <TrendingUp className="text-primary size-4" />
            Track week-over-week deltas; flag subjects under 60% accuracy for content review.
          </div>
        </div>
      </div>
    </section>
  );
}
