// Smart revision reminders — fires browser notifications when a concept's
// next_review_at is due, throttled to once per concept per day.
import { useEffect } from "react";
import { usePushNotifications } from "./use-push-notifications";

type Due = { id: string; title: string; dueAt: string | Date };

const FIRED_KEY = "sml.reminders.fired.v1";

function loadFired(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch { return {}; }
}
function saveFired(m: Record<string, string>) {
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(m)); } catch { /* quota */ }
}

export function useRevisionReminders(items: Due[] | undefined) {
  const { status, notify } = usePushNotifications();

  useEffect(() => {
    if (status !== "granted" || !items?.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const fired = loadFired();
    const now = Date.now();
    let changed = false;

    for (const it of items.slice(0, 5)) {
      const due = new Date(it.dueAt).getTime();
      if (Number.isNaN(due) || due > now) continue;
      if (fired[it.id] === today) continue;
      notify("Time to review", { body: it.title, tag: `rev-${it.id}` });
      fired[it.id] = today; changed = true;
    }
    if (changed) saveFired(fired);
  }, [items, status, notify]);
}
