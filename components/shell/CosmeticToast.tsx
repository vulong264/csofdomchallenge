"use client";

/**
 * Celebratory toast when a loot theme is earned. The provider collects newly
 * unlocked theme ids in `pendingUnlocks`; we surface them one stack, auto-clear
 * after a few seconds, and link to the Loot gallery to equip them.
 */
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { getTheme } from "@/lib/cosmetics/themes";
import { useProgress } from "@/lib/progress/context";

export function CosmeticToast() {
  const { pendingUnlocks, clearPendingUnlocks } = useProgress();

  useEffect(() => {
    if (pendingUnlocks.length === 0) return;
    const t = setTimeout(clearPendingUnlocks, 6000);
    return () => clearTimeout(t);
  }, [pendingUnlocks, clearPendingUnlocks]);

  const unique = Array.from(new Set(pendingUnlocks));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {unique.map((id) => {
          const theme = getTheme(id);
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-sm rounded-xl border border-accent/40 bg-surface px-4 py-3 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl"
                  style={{ background: theme.swatch.surface, color: theme.swatch.primary }}
                  aria-hidden
                >
                  {theme.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">New loot unlocked!</p>
                  <p className="truncate font-semibold">{theme.name} theme</p>
                </div>
                <Link
                  href="/loot"
                  onClick={clearPendingUnlocks}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:brightness-110"
                >
                  Equip
                </Link>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
