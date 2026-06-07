"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { rewardUnitIds } from "@/content/index";
import { THEMES, cosmeticStats, earnedThemeIds, getTheme } from "@/lib/cosmetics/themes";
import { useProgress } from "@/lib/progress/context";

/** Compact loot teaser on the dashboard — shows the next skin to chase. */
export function LootCard() {
  const { progress } = useProgress();
  const earned = new Set(earnedThemeIds(cosmeticStats(progress, rewardUnitIds())));
  const equipped = getTheme(progress.cosmetics.theme);
  const next = THEMES.find((t) => !earned.has(t.id));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Loot Vault</h3>
        <span className="text-sm text-muted tabular-nums">
          {earned.size}/{THEMES.length}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
        <span className="text-xl" aria-hidden>
          {equipped.emoji}
        </span>
        <span className="flex-1">
          Equipped: <span className="font-medium">{equipped.name}</span>
        </span>
      </div>
      {next ? (
        <p className="mt-2 text-xs text-muted">
          Next skin <span className="font-medium text-text">{next.name}</span> — {next.unlockLabel.toLowerCase()}.
        </p>
      ) : (
        <p className="mt-2 text-xs text-success">Every skin unlocked. Legend. 👑</p>
      )}
      <Link href="/loot" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
        Open the Loot Vault →
      </Link>
    </Card>
  );
}
