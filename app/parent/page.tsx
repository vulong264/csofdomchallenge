"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { StatusBadge } from "@/components/shell/StatusBadge";
import { UNITS, rewardUnitIds } from "@/content/index";
import { unitStatuses } from "@/lib/engine/gating";
import { levelProgress } from "@/lib/engine/xp";
import { nintendoTotals, projectedPayout } from "@/lib/rewards/compute";
import { useProgress } from "@/lib/progress/context";
import { formatShortDate } from "@/lib/util/dates";
import { formatMinutes, formatVND } from "@/lib/util/format";

function PinGate({ onUnlock, expected }: { onUnlock: () => void; expected: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  return (
    <Card className="mx-auto mt-6 max-w-sm p-6 text-center">
      <div className="text-3xl" aria-hidden>
        🔐
      </div>
      <h1 className="mt-2 text-xl font-semibold">Parent view</h1>
      <p className="mt-1 text-sm text-muted">Enter the PIN to see progress &amp; the reward ledger.</p>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin === expected) onUnlock();
          else setError(true);
        }}
      >
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          inputMode="numeric"
          type="password"
          placeholder="PIN"
          autoFocus
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-primary"
        />
        {error ? <p className="mt-2 text-sm text-danger">Wrong PIN.</p> : null}
        <Button type="submit" className="mt-4 w-full">
          Unlock
        </Button>
      </form>
      <p className="mt-3 text-xs text-faint">Default PIN is 1234 — change it once inside.</p>
    </Card>
  );
}

export default function ParentPage() {
  const { progress, ready, config, today, update } = useProgress();
  const [unlocked, setUnlocked] = useState(false);
  const [newPin, setNewPin] = useState("");

  if (!ready) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  if (!unlocked) return <PinGate expected={progress.settings.parentPin} onUnlock={() => setUnlocked(true)} />;

  const lp = levelProgress(progress.xp);
  const payout = projectedPayout(progress.units, rewardUnitIds(), config, progress.programStartLocalDate, today);
  const nin = nintendoTotals(progress.nintendo, progress.programStartLocalDate, today);
  const activeDays = new Set(progress.activity.map((a) => a.localDate)).size;
  const views = unitStatuses(UNITS, progress);
  const attempts = [...progress.attempts].sort((a, b) => (a.atISO < b.atISO ? 1 : -1));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{progress.learnerName}&apos;s progress</h1>
          <p className="text-muted">Read-only · started {formatShortDate(progress.programStartLocalDate)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setUnlocked(false)}>
          Lock
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Level" value={`Lv ${lp.level}`} sub={`${progress.xp} XP`} />
        <Stat label="Streak" value={`${progress.streak.current}d`} sub={`best ${progress.streak.longest}d`} />
        <Stat label="Active days" value={`${activeDays}`} sub={`${progress.activity.length} sessions`} />
        <Stat label="Projected payout" value={formatVND(payout.projectedTotalVND)} sub={`banked ${formatVND(payout.bankedMasteryVND)}`} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Sector mastery</h2>
        <div className="mt-3 grid gap-2">
          {views.map((v) => (
            <div key={v.unit.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <span className="flex-1">
                {v.unit.title}
                {!v.unit.isRewardSector ? <span className="ml-1 text-xs text-faint">· tutorial</span> : null}
              </span>
              {v.flawlessAchieved ? <Badge tone="accent">⭐</Badge> : null}
              <span className="w-14 text-right text-muted">{v.bestPercent}%</span>
              <StatusBadge status={v.status} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Every boss attempt</h2>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No attempts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-1 text-left font-medium">Date</th>
                  <th className="py-1 text-left font-medium">Sector</th>
                  <th className="py-1 text-right font-medium">Score</th>
                  <th className="py-1 text-right font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const unit = UNITS.find((u) => u.id === a.unitId);
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-1.5 text-muted">{formatShortDate(a.localDate)}</td>
                      <td className="py-1.5">{unit?.title ?? a.unitId}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {a.score}/{a.total} ({a.percent}%)
                      </td>
                      <td className="py-1.5 text-right">
                        {a.passed ? (a.flawless ? "⭐ Flawless" : "✓ Pass") : "✗ Fail"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Nintendo time</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="This week" value={formatMinutes(nin.thisWeekMin)} />
          <Stat label="All-time" value={formatMinutes(nin.totalMin)} />
        </div>
        <Link href="/bounty" className="mt-3 inline-block text-sm text-primary hover:underline">
          Full Bounty Board →
        </Link>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Change PIN</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            inputMode="numeric"
            placeholder="New PIN"
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono outline-none focus:border-primary"
          />
          <Button
            disabled={newPin.trim().length < 3}
            onClick={() => {
              const pin = newPin.trim();
              update((p) => ({ ...p, settings: { ...p.settings, parentPin: pin } }));
              setNewPin("");
            }}
          >
            Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-faint">
          Reward dials live in <code className="font-mono">lib/rewards/config.ts</code>; in-app tuning arrives in the
          polish step.
        </p>
      </Card>
    </div>
  );
}
