"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { getUnit, rewardUnitIds, rewardUnits } from "@/content/index";
import { getUnitProgress } from "@/lib/engine/gating";
import { nintendoTotals, projectedPayout, vaultTiers } from "@/lib/rewards/compute";
import { useProgress } from "@/lib/progress/context";
import { formatShortDate } from "@/lib/util/dates";
import { formatMinutes, formatVND } from "@/lib/util/format";

export default function BountyPage() {
  const { progress, ready, config, today } = useProgress();
  if (!ready) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  const start = progress.programStartLocalDate;
  const ids = rewardUnitIds();
  const payout = projectedPayout(progress.units, ids, config, start, today);
  const tiers = vaultTiers(config, start);
  const nin = nintendoTotals(progress.nintendo, start, today);
  const attempts = [...progress.attempts].sort((a, b) => (a.atISO < b.atISO ? 1 : -1));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Bounty Board</h1>
        <p className="text-muted">The honest record. The numbers are the numbers — a parent settles the real payout.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Banked (safe)" value={formatVND(payout.bankedMasteryVND)} sub="never lost" />
        <Stat label="Projected total" value={formatVND(payout.projectedTotalVND)} sub={`cap ${formatVND(payout.capVND)}`} />
        <Stat label="Still on the table" value={formatVND(payout.remainingVND)} sub="if you nail it from here" />
      </div>

      {/* Mastery cash */}
      <Card className="p-5">
        <h2 className="font-semibold">Mastery cash</h2>
        <p className="text-xs text-muted">{formatVND(config.mastery.perSectorVND)} per sector · +{formatVND(config.mastery.flawlessBonusVND)} Flawless. Banked for good.</p>
        <div className="mt-3 grid gap-2">
          {rewardUnits().map((u) => {
            const up = getUnitProgress(progress, u.id);
            const mastered = up.status === "mastered" || up.bestPercent >= 80;
            const cash = (mastered ? config.mastery.perSectorVND : 0) + (up.flawlessAchieved ? config.mastery.flawlessBonusVND : 0);
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <span className="grid h-7 w-7 place-items-center rounded bg-surface-3 text-xs font-bold">{u.sector.number}</span>
                <span className="flex-1">{u.title}</span>
                {mastered ? <Badge tone="success">Cleared</Badge> : <Badge tone="muted">Pending</Badge>}
                {up.flawlessAchieved ? <Badge tone="accent">⭐ Flawless</Badge> : null}
                <span className="w-24 text-right font-medium tabular-nums">{formatVND(cash)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Speed vault */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Speed Vault</h2>
          <span className="font-bold tabular-nums text-accent">{formatVND(Math.max(0, payout.vault.value))}</span>
        </div>
        <p className="text-xs text-muted">Finish the whole dungeon early to keep more. Determined by the day the final boss falls.</p>
        <div className="mt-3 grid gap-2">
          {tiers.map((t) => (
            <div key={t.tier} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <span className="flex-1">{t.label}</span>
              <span className="text-xs text-muted">until {formatShortDate(t.untilLocalDate)}</span>
              <span className="w-24 text-right font-medium tabular-nums">{formatVND(t.value)}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm">
            <span className="flex-1">After week {config.weeks.deadlineWeek}</span>
            <span className="text-xs text-muted">−{formatVND(config.speedVault.postWeek6PenaltyPerWeekVND)}/week</span>
            <span className="w-24 text-right font-medium tabular-nums text-danger">
              −{formatVND(config.speedVault.postWeek6PenaltyCapVND)} max
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          {payout.vault.locked
            ? `Locked in — finished ${formatShortDate(payout.vault.effectiveLocalDate)}.`
            : payout.vault.nextDropLocalDate
              ? `Currently ${payout.vault.label}. Drops to ${formatVND(Math.max(0, payout.vault.nextValue ?? 0))} on ${formatShortDate(payout.vault.nextDropLocalDate)}.`
              : payout.vault.penalty > 0
                ? `Overdue — penalty of ${formatVND(payout.vault.penalty)} applies.`
                : ""}
        </p>
      </Card>

      {/* Nintendo time */}
      <Card className="p-5">
        <h2 className="font-semibold">Nintendo time</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="This week" value={formatMinutes(nin.thisWeekMin)} />
          <Stat label="Earned all-time" value={formatMinutes(nin.totalMin)} />
        </div>
        {progress.nintendo.length > 0 ? (
          <ul className="mt-3 grid gap-1 text-sm">
            {[...progress.nintendo].slice(-6).reverse().map((n) => (
              <li key={n.id} className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5">
                <span className="text-muted">
                  {formatShortDate(n.localDate)} · {n.reason}
                </span>
                <span className="font-medium tabular-nums">+{formatMinutes(n.minutes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No Nintendo time earned yet — finish a session today for +{config.nintendo.dailySessionMin} min.</p>
        )}
      </Card>

      {/* Boss attempt log */}
      <Card className="p-5">
        <h2 className="font-semibold">Boss attempts</h2>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No boss fights yet.</p>
        ) : (
          <ul className="mt-3 grid gap-1 text-sm">
            {attempts.map((a) => {
              const unit = getUnit(a.unitId);
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-1.5">
                  <span className="flex-1">{unit?.sector.boss ?? a.unitId}</span>
                  <span className="text-xs text-muted">{formatShortDate(a.localDate)}</span>
                  {a.flawless ? <Badge tone="accent">⭐</Badge> : null}
                  <Badge tone={a.passed ? "success" : "danger"}>{a.percent}%</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Link href="/" className="text-sm text-primary hover:underline">
        ← Back to the Dungeon
      </Link>
    </div>
  );
}
