// Lightweight localStorage-backed cache for offline-first mobile use.
// Wraps any async fetcher: returns cached value immediately while revalidating.
import { useEffect, useState } from "react";

const PREFIX = "sml.offline.v1::";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type Entry<T> = { v: T; t: number };

function read<T>(key: string): Entry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (Date.now() - parsed.t > MAX_AGE_MS) return null;
    return parsed;
  } catch { return null; }
}

function write<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ v, t: Date.now() } satisfies Entry<T>)); }
  catch { /* quota */ }
}

export function useOfflineQuery<T>(key: string, fetcher: () => Promise<T>) {
  const cached = read<T>(key);
  const [data, setData] = useState<T | null>(cached?.v ?? null);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [isStale, setIsStale] = useState<boolean>(!!cached);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    (async () => {
      try {
        const fresh = await fetcher();
        if (cancelled) return;
        setData(fresh); setIsStale(false); setError(null);
        write(key, fresh);
      } catch (e) {
        if (cancelled) return;
        setError(e as Error);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isOffline, isStale, error, hasCached: !!cached };
}

export function setOffline<T>(key: string, value: T) { write(key, value); }
export function getOffline<T>(key: string): T | null { return read<T>(key)?.v ?? null; }
