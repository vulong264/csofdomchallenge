"use client";

/**
 * Accrues focused time-on-task into `progress.timeOnTaskMs` so the Parent view
 * can report how long Tom actually spends in the dungeon. Only counts time while
 * the tab is visible; flushes to storage roughly once a minute and on exit, so
 * a closed tab never loses more than the last unflushed tick. Renders nothing.
 */
import { useEffect, useRef } from "react";
import { useProgress } from "@/lib/progress/context";

const TICK_MS = 20_000;
const FLUSH_MS = 60_000;

export function TimeTracker() {
  const { ready, update } = useProgress();
  const pendingRef = useRef(0);

  useEffect(() => {
    if (!ready) return;
    let interval: ReturnType<typeof setInterval> | null = null;

    const flush = () => {
      const ms = pendingRef.current;
      if (ms < 1000) return;
      pendingRef.current = 0;
      update((p) => ({ ...p, timeOnTaskMs: p.timeOnTaskMs + ms }));
    };

    const tick = () => {
      pendingRef.current += TICK_MS;
      if (pendingRef.current >= FLUSH_MS) flush();
    };

    const start = () => {
      if (interval == null) interval = setInterval(tick, TICK_MS);
    };
    const stop = () => {
      if (interval != null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else {
        stop();
        flush();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      stop();
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [ready, update]);

  return null;
}
