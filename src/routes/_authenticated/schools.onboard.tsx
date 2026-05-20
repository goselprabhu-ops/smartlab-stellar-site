import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { School } from "lucide-react";
import { createSchool } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schools/onboard")({
  component: OnboardSchool,
});

function OnboardSchool() {
  const nav = useNavigate();
  const fn = useServerFn(createSchool);
  const [name, setName] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [city, setCity] = useState("");

  const m = useMutation({
    mutationFn: () => fn({ data: { name, board, city, plan: "free" } }),
    onSuccess: () => { toast.success("School created"); nav({ to: "/school" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-xl space-y-6 py-12">
      <div className="space-y-2 text-center">
        <School className="mx-auto size-10 text-primary" />
        <h1 className="font-display text-3xl font-semibold">Create your school workspace</h1>
        <p className="text-muted-foreground">
          You'll become the school admin. You can add batches, teachers, and students next.
        </p>
      </div>
      <form
        className="space-y-4 rounded-2xl border bg-card p-6 elev-1"
        onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
      >
        <div className="space-y-2">
          <Label>School name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Board</Label>
            <Input value={board} onChange={(e) => setBoard(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={m.isPending} className="w-full">
          {m.isPending ? "Creating…" : "Create school"}
        </Button>
      </form>
    </div>
  );
}
