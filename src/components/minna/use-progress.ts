"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { decodeProgress, MINNA_STORAGE_KEY } from "@/lib/minna/progress";
import type { MinnaProgress } from "@/lib/minna/types";

let memory = "{}";
let storageFailed = false;
const event = "minna-progress-change";
function snapshot() {
  if (storageFailed) return memory;
  try { return localStorage.getItem(MINNA_STORAGE_KEY) ?? "{}"; } catch { return memory; }
}
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify); window.addEventListener(event, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(event, notify); };
}
function parse(raw: string): Record<string, unknown> {
  try { const data = JSON.parse(raw); return data && typeof data === "object" && !Array.isArray(data) ? data : {}; } catch { return {}; }
}
export function useMinnaStore() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const data = useMemo(() => parse(raw), [raw]);
  return { data, ready, storageFailed };
}
export function useLessonProgress(id: number) {
  const store = useMinnaStore();
  const progress = useMemo(() => decodeProgress(store.data[String(id)]), [store.data, id]);
  const update = useCallback((action: (prior: MinnaProgress) => MinnaProgress) => {
    const data = parse(snapshot());
    data[String(id)] = action(decodeProgress(data[String(id)]));
    memory = JSON.stringify(data);
    try { localStorage.setItem(MINNA_STORAGE_KEY, memory); storageFailed = false; } catch { storageFailed = true; }
    window.dispatchEvent(new Event(event));
  }, [id]);
  return { progress, update, ready: store.ready, storageFailed: store.storageFailed };
}
