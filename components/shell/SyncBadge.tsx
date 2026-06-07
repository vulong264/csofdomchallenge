"use client";

/**
 * Compact cross-device sync indicator for the TopBar. Passive when synced;
 * clickable to (re)link when standalone or offline. Hidden until hydrated and
 * when sync isn't configured server-side (pure local-only deployments).
 */
import { useProgress } from "@/lib/progress/context";
import { getAccessCode } from "@/lib/sync/client";
import { cn } from "@/lib/util/cn";

const LABEL: Record<string, { text: string; tone: string }> = {
  connecting: { text: "Syncing…", tone: "text-muted" },
  synced: { text: "☁ Synced", tone: "text-accent" },
  offline: { text: "⚠ Offline", tone: "text-muted" },
  "needs-code": { text: "🔗 Link device", tone: "text-muted" },
  local: { text: "🔗 Sync", tone: "text-faint" },
};

export function SyncBadge() {
  const { ready, syncState, requestSync } = useProgress();

  // Don't show anything until we know the server's stance. A device that has
  // never been offered a code (no stored code) and reports `local` is almost
  // certainly a sync-disabled deployment — stay quiet there.
  if (!ready || syncState === "connecting") return null;
  if (syncState === "local" && !getAccessCode()) return null;

  const { text, tone } = LABEL[syncState] ?? LABEL.local;
  const interactive = syncState !== "synced";

  return (
    <button
      type="button"
      onClick={interactive ? requestSync : undefined}
      disabled={!interactive}
      title={interactive ? "Link / refresh cross-device sync" : "Progress is synced across devices"}
      className={cn(
        "hidden text-xs font-medium sm:inline-flex",
        tone,
        interactive ? "cursor-pointer hover:underline" : "cursor-default",
      )}
    >
      {text}
    </button>
  );
}
