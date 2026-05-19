import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Send, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotifications,
});

const recent = [
  { id: "n1", title: "Weekly mock test live",   audience: "All students",     sent: "2h ago",  delivered: 8240 },
  { id: "n2", title: "Parent report ready",     audience: "Parents",          sent: "Yesterday", delivered: 3120 },
  { id: "n3", title: "New Physics chapter",     audience: "Class 11 & 12",    sent: "3d ago",  delivered: 2140 },
  { id: "n4", title: "Holiday schedule update", audience: "All users",        sent: "1w ago",  delivered: 11_200 },
];

function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Broadcast announcements, alerts, and reminders across the platform.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border bg-card p-6 elev-2 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold">Compose</h3>
          <div className="space-y-2">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New mock test available" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-body">Message</Label>
            <Textarea id="n-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write your announcement…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="students">All students</SelectItem>
                  <SelectItem value="parents">All parents</SelectItem>
                  <SelectItem value="teachers">All teachers</SelectItem>
                  <SelectItem value="class-9">Class 9</SelectItem>
                  <SelectItem value="class-10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select defaultValue="inapp">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inapp">In-app</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="all">All channels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline"><Calendar className="size-4" /> Schedule</Button>
            <Button
              onClick={() => {
                if (!title.trim()) return toast.error("Add a title");
                toast.success("Notification queued for delivery");
                setTitle(""); setBody("");
              }}
            >
              <Send className="size-4" /> Send now
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-6 elev-2">
          <div className="flex items-center gap-2">
            <Bell className="text-primary size-4" />
            <h3 className="font-display text-sm font-semibold">Delivery this week</h3>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Sent"      value="24,712" />
            <Row label="Opened"    value="14,830" sub="60% open rate" />
            <Row label="Clicked"   value="3,940"  sub="16% CTR" />
            <Row label="Bounced"   value="42" />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Users className="mr-1 inline size-3" /> Segmented sends reach ~38% more students than broadcasts.
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-2">
        <div className="border-b p-4">
          <h3 className="font-display text-sm font-semibold">Recent broadcasts</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Audience</th>
              <th className="p-3">Sent</th>
              <th className="p-3 text-right">Delivered</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-3 font-medium">{n.title}</td>
                <td className="p-3"><Badge variant="outline">{n.audience}</Badge></td>
                <td className="p-3 text-muted-foreground">{n.sent}</td>
                <td className="p-3 text-right font-mono">{n.delivered.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b pb-2 last:border-0">
      <div>
        <div className="font-medium">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
      <div className="font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
