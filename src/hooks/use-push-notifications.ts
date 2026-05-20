// Browser Notifications API wrapper — works on installed PWAs and modern mobile browsers.
// No service worker required for simple in-session reminders.
import { useCallback, useEffect, useState } from "react";

type Status = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [status, setStatus] = useState<Status>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported"); return;
    }
    setStatus(Notification.permission as Status);
  }, []);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    const res = await Notification.requestPermission();
    setStatus(res as Status);
    return res;
  }, []);

  const notify = useCallback((title: string, opts?: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    if (Notification.permission !== "granted") return null;
    return new Notification(title, { icon: "/favicon.ico", badge: "/favicon.ico", ...opts });
  }, []);

  return { status, request, notify, supported: status !== "unsupported" };
}
