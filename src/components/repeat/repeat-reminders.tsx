"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decodeRepeat, localDate, REPEAT_KEY } from "@/lib/repeat";

export function RepeatReminders() {
  const router = useRouter();
  const [due, setDue] = useState(0);
  useEffect(() => {
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const data = decodeRepeat(localStorage.getItem(REPEAT_KEY));
        const today = localDate(), now = new Date(), time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setDue(data.plans.reduce((n, p) => n + p.dates.filter(d => d <= today && !p.completed.includes(d)).length, 0));
        for (const plan of data.plans) {
          if (!plan.reminder || !("Notification" in window) || Notification.permission !== "granted") continue;
          const date = plan.dates.find(d => !plan.completed.includes(d) && (d < today || (d === today && plan.time <= time)));
          const key = `repeat-notified:${plan.id}:${today}`;
          if (!date || localStorage.getItem(key)) continue;
          const options = { body: `${plan.name}: có buổi học đang chờ bạn.`, tag: key, icon: "/icons/icon-192x192.png", data: { url: "/repeat" } };
          const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
          if (registration) await registration.showNotification("Đến giờ học Repeat", options);
          else { const notification = new Notification("Đến giờ học Repeat", options); notification.onclick = () => { window.focus(); router.push("/repeat"); notification.close(); }; }
          localStorage.setItem(key, "1");
        }
      } catch { /* Storage/notification denial must not break the rest of the app. */ }
      finally { busy = false; }
    };
    void check(); const timer = setInterval(check, 30000);
    window.addEventListener("focus", check); window.addEventListener("storage", check); window.addEventListener("repeat-updated", check);
    return () => { clearInterval(timer); window.removeEventListener("focus", check); window.removeEventListener("storage", check); window.removeEventListener("repeat-updated", check); };
  }, [router]);
  return due > 0 ? <Link href="/repeat" className="repeat-due-banner" lang="vi">↻ Repeat · {due} buổi đến hạn</Link> : null;
}
