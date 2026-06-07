"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Stat } from "@/components/ui/Stat";
import { rewardUnitIds } from "@/content/index";
import { projectedPayout } from "@/lib/rewards/compute";
import { useProgress } from "@/lib/progress/context";
import { formatShortDate } from "@/lib/util/dates";
import { formatVND } from "@/lib/util/format";

export function VaultMeter() {
  const { progress, config, today } = useProgress();
  const ids = rewardUnitIds();
  const payout = projectedPayout(progress.units, ids, config, progress.programStartLocalDate, today);
  const { vault } = payout;
  const shown = Math.max(0, vault.value);
  const pct = (shown / config.speedVault.week4VND) * 100;

  const nudge = vault.locked
    ? `Locked in at ${formatVND(shown)} — you finished ${formatShortDate(vault.effectiveLocalDate)}.`
    : vault.nextDropLocalDate
      ? `Clear all sectors by ${formatShortDate(vault.nextDropLocalDate)} to keep ${formatVND(shown)} — it drops to ${formatVND(Math.max(0, vault.nextValue ?? 0))} after.`
      : vault.penalty > 0
        ? `Overdue — a ${formatVND(vault.penalty)} penalty now applies to the final payout.`
        : "—";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Speed Vault</h3>
        <span className="text-lg font-bold tabular-nums text-accent">{formatVND(shown)}</span>
      </div>
      <ProgressBar value={pct} className="mt-3" barClassName="bg-accent" />
      <p className="mt-2 text-sm text-muted">{nudge}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Banked" value={formatVND(payout.bankedMasteryVND)} sub="never lost" />
        <Stat label="Projected total" value={formatVND(payout.projectedTotalVND)} sub={`cap ${formatVND(payout.capVND)}`} />
      </div>
      <Link href="/bounty" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
        Open the Bounty Board →
      </Link>
    </Card>
  );
}
