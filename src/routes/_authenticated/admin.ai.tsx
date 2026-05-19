import { createFileRoute } from "@tanstack/react-router";
import { Brain, Zap, ShieldAlert, DollarSign, Activity, Settings2 } from "lucide-react";
import { FeatureShell } from "@/components/FeatureShell";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  component: AdminAi,
});

function AdminAi() {
  return (
    <FeatureShell
      eyebrow="AI Management"
      title="Monitor and tune the AI engine"
      description="Track model usage, cost, latency, and behavior across every AI-powered feature."
      status="beta"
      groups={[
        {
          title: "Operational controls",
          items: [
            { icon: Activity, title: "Usage by feature", description: "Tutor, remediation, quiz gen, plan gen — see what's consuming compute." },
            { icon: DollarSign, title: "Cost analytics", description: "Per-user and per-feature cost broken down by model." },
            { icon: Zap, title: "Latency monitoring", description: "P50 / P95 / P99 response times and failure rates by model." },
            { icon: Brain, title: "Model routing", description: "Pin features to specific Lovable AI models or fall back gracefully." },
            { icon: ShieldAlert, title: "Safety guardrails", description: "Content filters, prompt-injection defenses, and audit log." },
            { icon: Settings2, title: "Prompt registry", description: "Versioned prompts with rollback and A/B comparison." },
          ],
        },
      ]}
    />
  );
}
