import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, PieChart, LineChart, Layers, Brain, Eye, Zap, Workflow } from "lucide-react";
import { MarketingFeaturePage } from "@/components/marketing/MarketingFeaturePage";

export const Route = createFileRoute("/product/analytics")({
  head: () => ({
    meta: [
      { title: "Learning Analytics — Smart Lab Online" },
      { name: "description", content: "Memory heatmaps, mastery trends, and AI-generated insights — turn study data into action." },
      { property: "og:title", content: "Learning Analytics — Smart Lab Online" },
      { property: "og:description", content: "Heatmaps, mastery curves, and AI insights that actually change behavior." },
    ],
  }),
  component: AnalyticsMarketing,
});

function HeatmapPreview() {
  const subjects = ["Math", "Science", "English", "Social", "Hindi"];
  const weeks = 12;
  const cell = (i: number, j: number) => {
    const v = ((i * 7 + j * 3) % 5) / 4; // deterministic mock
    const bg = `oklch(${0.6 + v * 0.25} 0.18 ${230 - v * 60})`;
    return <div key={`${i}-${j}`} className="h-5 w-full rounded-[3px]" style={{ background: bg }} />;
  };
  return (
    <div className="bg-background rounded-xl border p-5">
      <div className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">Memory heatmap · last 12 weeks</div>
      <div className="space-y-1.5">
        {subjects.map((s, i) => (
          <div key={s} className="grid grid-cols-[80px_1fr] items-center gap-3">
            <div className="text-xs font-medium">{s}</div>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: weeks }).map((_, j) => cell(i, j))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Cold (forgotten)</span>
        <span>Warm (mastered)</span>
      </div>
    </div>
  );
}

function AnalyticsMarketing() {
  return (
    <MarketingFeaturePage
      eyebrow="Learning Analytics"
      title={<>Data that tells you <span className="text-accent">what to do next</span>.</>}
      description="Heatmaps, mastery trends, and AI-generated insights — designed for students, parents, and teachers, not data scientists."
      primaryCta={{ label: "See the dashboard", to: "/demo" }}
      secondaryCta={{ label: "Compare plans", to: "/pricing" }}
      heroVisual={<HeatmapPreview />}
      explanation={{
        title: "From raw data to clear next steps",
        body: "Every quiz, session, and revision turns into signal. The analytics engine surfaces the 2–3 things that will move the needle this week.",
        bullets: [
          "Memory heatmaps show what's cold, warm, or mastered",
          "Mastery curves per chapter and per concept",
          "AI insights written in plain language, not chart-jargon",
          "Cohort views for teachers and schools",
          "Exportable reports for parent–teacher meetings",
        ],
      }}
      preview={{
        title: "Memory heatmap, at a glance",
        description: "12 weeks × 5 subjects. Cold cells = revision queued automatically.",
        node: <HeatmapPreview />,
      }}
      benefits={[
        { icon: Brain, title: "Insight over data", description: "Plain-language takeaways, not dashboards to decode." },
        { icon: BarChart3, title: "Drillable depth", description: "Subject → chapter → concept → question." },
        { icon: LineChart, title: "Trend awareness", description: "Spot stalls and surges before they show on report cards." },
        { icon: PieChart, title: "Time allocation", description: "See where minutes are actually spent." },
        { icon: Layers, title: "Cohort views", description: "Built-in for teachers and tuition centers." },
        { icon: Eye, title: "Parent-friendly", description: "Same data, a calmer view for guardians." },
      ]}
      outcomes={[
        { stat: "3", label: "Insights per week", sub: "Auto-prioritized by the AI" },
        { stat: "−47%", label: "Time spent re-explaining trends" },
        { stat: "2.1×", label: "Teacher-meeting prep speed" },
        { stat: "Live", label: "Updated continuously" },
      ]}
      comparison={{
        theirsLabel: "Spreadsheet reports",
        rows: [
          { label: "Memory heatmap", us: true, them: false },
          { label: "AI-written insights", us: true, them: false },
          { label: "Updates in real time", us: true, them: false },
          { label: "Built for non-technical readers", us: true, them: false },
          { label: "Drill-to-question detail", us: true, them: false },
        ],
      }}
    />
  );
}
