import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateProfile } from "@/lib/auth.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const auth = useAuth();
  const upd = useServerFn(updateProfile);
  const [name, setName] = useState(auth.profile?.full_name ?? "");
  const [grade, setGrade] = useState(auth.profile?.grade ?? "");
  const [school, setSchool] = useState(auth.profile?.school ?? "");

  const save = async () => {
    try {
      await upd({ data: { full_name: name, grade, school } });
      toast.success("Profile saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <div className="mt-8 space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
        <button onClick={save} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Save profile
        </button>
      </div>
    </div>
  );
}
