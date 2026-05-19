import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: AdminSubscriptions,
});

const plans = [
  { name: "Free",         active: 8240, mrr: 0,      change: "+312"  },
  { name: "Pro Monthly",  active: 1820, mrr: 8190,   change: "+96"   },
  { name: "Pro Annual",   active: 612,  mrr: 14_688, change: "+42"   },
  { name: "School",       active: 38,   mrr: 22_400, change: "+3"    },
];

function AdminSubscriptions() {
  const totalMrr = plans.reduce((s, p) => s + p.mrr, 0);
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Subscriptions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plan distribution, MRR, churn signals, and dunning state.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 elev-2">
          <CreditCard className="text-primary mb-3 size-5" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">MRR</div>
          <div className="font-display text-3xl font-semibold">${totalMrr.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 elev-2">
          <Users className="text-primary mb-3 size-5" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Paying</div>
          <div className="font-display text-3xl font-semibold">2,470</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 elev-2">
          <TrendingUp className="text-primary mb-3 size-5" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Net adds (7d)</div>
          <div className="font-display text-3xl font-semibold">+141</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Plan</th>
              <th className="p-3 text-right">Active</th>
              <th className="p-3 text-right">MRR</th>
              <th className="p-3 text-right">7-day change</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.name} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-right font-mono">{p.active.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">${p.mrr.toLocaleString()}</td>
                <td className="p-3 text-right"><span className="text-success">{p.change}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border bg-warning/10 p-4 elev-1">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-warning mt-0.5 size-4" />
          <div className="text-sm">
            <span className="font-medium">12 subscriptions</span>{" "}
            <span className="text-muted-foreground">are in dunning. Review and retry payments.</span>{" "}
            <Badge variant="outline">Action needed</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
