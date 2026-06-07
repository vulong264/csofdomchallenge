"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { rewardUnitIds } from "@/content/index";
import { THEMES, cosmeticStats, earnedThemeIds, type ThemeDef } from "@/lib/cosmetics/themes";
import { useProgress } from "@/lib/progress/context";
import { cn } from "@/lib/util/cn";

function ThemePreview({ theme }: { theme: ThemeDef }) {
  const { bg, surface, primary, accent } = theme.swatch;
  return (
    <div className="h-20 w-full overflow-hidden rounded-lg border border-border" style={{ background: bg }} aria-hidden>
      <div className="flex h-full items-center gap-2 p-3">
        <div className="grid h-full flex-1 place-items-center rounded-md" style={{ background: surface }}>
          <span className="text-lg" style={{ color: primary }}>
            {theme.emoji}
          </span>
        </div>
        <div className="flex h-full flex-col justify-center gap-1.5">
          <span className="h-2.5 w-10 rounded-full" style={{ background: primary }} />
          <span className="h-2.5 w-7 rounded-full" style={{ background: accent }} />
          <span className="h-2.5 w-9 rounded-full" style={{ background: surface, border: `1px solid ${accent}` }} />
        </div>
      </div>
    </div>
  );
}

export default function LootPage() {
  const { progress, ready, update } = useProgress();

  if (!ready) {
    return (
      <div className="grid gap-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const earned = new Set(earnedThemeIds(cosmeticStats(progress, rewardUnitIds())));
  const equipped = progress.cosmetics.theme;
  const unlockedCount = earned.size;

  const equip = (id: string) =>
    update((p) => ({ ...p, cosmetics: { ...p.cosmetics, theme: id } }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Loot Vault 🎒</h1>
          <p className="text-muted">Cosmetic skins for the whole app. Pure swagger — they never affect cash or XP.</p>
        </div>
        <Badge tone="accent">
          {unlockedCount}/{THEMES.length} unlocked
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme, i) => {
          const isUnlocked = earned.has(theme.id);
          const isEquipped = equipped === theme.id;
          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  "flex h-full flex-col gap-3 p-4 transition-colors",
                  isEquipped ? "border-accent ring-1 ring-accent/40" : "hover:border-border-strong",
                  !isUnlocked && "opacity-80",
                )}
              >
                <div className="relative">
                  <ThemePreview theme={theme} />
                  {!isUnlocked ? (
                    <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/45 text-2xl backdrop-blur-[1px]">
                      🔒
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{theme.name}</h2>
                  {isEquipped ? <Badge tone="accent">Equipped</Badge> : null}
                </div>
                <p className="flex-1 text-sm text-muted">{theme.blurb}</p>
                {isUnlocked ? (
                  <Button
                    variant={isEquipped ? "outline" : "primary"}
                    size="sm"
                    disabled={isEquipped}
                    onClick={() => equip(theme.id)}
                  >
                    {isEquipped ? "Currently equipped" : "Equip"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                    <span aria-hidden>🗝️</span>
                    <span>{theme.unlockLabel}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
