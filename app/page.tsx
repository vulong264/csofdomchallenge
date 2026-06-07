"use client";

import { DataControls } from "@/components/dashboard/DataControls";
import { NextActionCard } from "@/components/dashboard/NextActionCard";
import { SectorMap } from "@/components/dashboard/SectorMap";
import { VaultMeter } from "@/components/dashboard/VaultMeter";
import { WarmUpsCard } from "@/components/dashboard/WarmUpsCard";
import { Stat } from "@/components/ui/Stat";
import { currentPower, streakAlive } from "@/lib/engine/streak";
import { levelProgress } from "@/lib/engine/xp";
import { useProgress } from "@/lib/progress/context";

function Skeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl bg-surface" />
        <div className="h-20 animate-pulse rounded-xl bg-surface" />
        <div className="h-20 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { progress, ready, today } = useProgress();
  if (!ready) return <Skeleton />;

  const lp = levelProgress(progress.xp);
  const alive = streakAlive(progress.streak, today);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Hi {progress.learnerName} 👋</h1>
        <p className="text-muted">Welcome back to the dungeon. Here&apos;s your next move.</p>
      </div>

      <NextActionCard />
      <WarmUpsCard />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Level" value={`Lv ${lp.level}`} sub={`${lp.intoLevel}/${lp.span} XP to next`} />
        <Stat
          label="Streak"
          value={`${progress.streak.current} day${progress.streak.current === 1 ? "" : "s"}`}
          sub={alive ? "alive 🔥" : "start one today"}
        />
        <Stat label="Power" value={`${currentPower(progress.streak, today)}%`} sub="combo meter" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">The Dungeon</h2>
          <SectorMap />
        </div>
        <div className="grid content-start gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">Rewards</h2>
          <VaultMeter />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-faint">Your data — survives a browser wipe</p>
        <DataControls />
      </div>
    </div>
  );
}
