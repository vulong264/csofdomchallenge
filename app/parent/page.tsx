"use client";

import Link from "next/link";
import { useState } from "react";
import { RewardTuner } from "@/components/parent/RewardTuner";
import { StatusBadge } from "@/components/shell/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Stat } from "@/components/ui/Stat";
import { UNITS, rewardUnitIds, topicLabels } from "@/content/index";
import { getTheme } from "@/lib/cosmetics/themes";
import { unitStatuses } from "@/lib/engine/gating";
import { levelProgress } from "@/lib/engine/xp";
import {
  ACTIVITY_KINDS,
  activeDays,
  activeDaysThisWeek,
  activityRollup,
  minutesOnTask,
  topicBreakdown,
} from "@/lib/progress/analytics";
import { useProgress } from "@/lib/progress/context";
import { nintendoTotals, projectedPayout } from "@/lib/rewards/compute";
import { formatShortDate } from "@/lib/util/dates";
import { formatMinutes, formatVND } from "@/lib/util/format";

const KIND_META: Record<string, { label: string; icon: string }> = {
  lesson: { label: "Lessons", icon: "📖" },
  drill: { label: "Drills", icon: "🎯" },
  review: { label: "Warm-ups", icon: "🔁" },
  "boss-attempt": { label: "Boss fights", icon: "⚔️" },
  tutor: { label: "Tutor chats", icon: "💬" },
};

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

  const start = progress.programStartLocalDate;
  const lp = levelProgress(progress.xp);
  const payout = projectedPayout(progress.units, rewardUnitIds(), config, start, today);
  const nin = nintendoTotals(progress.nintendo, start, today);
  const days = activeDays(progress.activity);
  const activeThisWeek = activeDaysThisWeek(progress.activity, start, today);
  const views = unitStatuses(UNITS, progress);
  const attempts = [...progress.attempts].sort((a, b) => (a.atISO < b.atISO ? 1 : -1));
  const rollup = activityRollup(progress.activity);
  const labels = topicLabels();
  const topics = topicBreakdown(progress.attempts);
  const weakTopics = topics.filter((t) => t.pct < 80);
  const minutes = minutesOnTask(progress.timeOnTaskMs);
  const theme = getTheme(progress.cosmetics.theme);
  const themesUnlocked = progress.cosmetics.unlocked.filter((u) => u.startsWith("theme:")).length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{progress.learnerName}&apos;s progress</h1>
          <p className="text-muted">Read-only · started {formatShortDate(start)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setUnlocked(false)}>
          Lock
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Level" value={`Lv ${lp.level}`} sub={`${progress.xp} XP`} />
        <Stat label="Streak" value={`${progress.streak.current}d`} sub={`best ${progress.streak.longest}d`} />
        <Stat label="Active days" value={`${days.length}`} sub={`${activeThisWeek} this week`} />
        <Stat label="Time on task" value={formatMinutes(minutes)} sub={`${rollup.totalEvents} sessions`} />
        <Stat label="Projected payout" value={formatVND(payout.projectedTotalVND)} sub={`banked ${formatVND(payout.bankedMasteryVND)}`} />
      </div>

      {/* Per-sector mastery with detail */}
      <Card className="p-5">
        <h2 className="font-semibold">Sector mastery</h2>
        <div className="mt-3 grid gap-2">
          {views.map((v) => {
            const up = progress.units[v.unit.id];
            const lessonsTotal = v.unit.lessons.length;
            const lessonsDone = up?.lessonsDone.length ?? 0;
            return (
              <div key={v.unit.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-surface-3 text-xs font-bold tabular-nums">
                    {v.unit.sector.number}
                  </span>
                  <span className="flex-1 font-medium">
                    {v.unit.title}
                    {!v.unit.isRewardSector ? <span className="ml-1 text-xs text-faint">· tutorial</span> : null}
                  </span>
                  {v.flawlessAchieved ? <Badge tone="accent">⭐ Flawless</Badge> : null}
                  <StatusBadge status={v.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-9 text-xs text-muted">
                  <span>
                    Best <span className="font-medium text-text tabular-nums">{v.bestPercent}%</span>
                  </span>
                  <span>
                    Lessons{" "}
                    <span className="font-medium text-text tabular-nums">
                      {lessonsDone}/{lessonsTotal}
                    </span>
                  </span>
                  <span>
                    Attempts <span className="font-medium text-text tabular-nums">{up?.attemptsCount ?? 0}</span>
                  </span>
                  {up?.masteredLocalDate ? <span>Cleared {formatShortDate(up.masteredLocalDate)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Weak topics — where to focus */}
      <Card className="p-5">
        <h2 className="font-semibold">Topic accuracy</h2>
        {topics.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No boss attempts yet — topic-level accuracy appears after the first test.</p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Marks earned per syllabus topic across all boss attempts.
              {weakTopics.length > 0 ? " Topics below 80% are worth a revisit." : " All topics above 80% — solid."}
            </p>
            <div className="mt-3 grid gap-2">
              {topics.map((t) => (
                <div key={t.topicCode} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 font-mono text-xs text-faint">{t.topicCode}</span>
                  <span className="min-w-0 flex-1 truncate">{labels[t.topicCode] ?? "—"}</span>
                  <ProgressBar
                    value={t.pct}
                    className="hidden w-28 sm:block"
                    barClassName={t.pct >= 80 ? "bg-success" : t.pct >= 50 ? "bg-warn" : "bg-danger"}
                  />
                  <span className="w-20 shrink-0 text-right tabular-nums text-muted">
                    {t.correct}/{t.total} · {t.pct}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Engagement */}
      <Card className="p-5">
        <h2 className="font-semibold">Engagement</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ACTIVITY_KINDS.map((k) => {
            const m = KIND_META[k];
            const slot = rollup.byKind[k];
            return (
              <div key={k} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-center">
                <div className="text-lg" aria-hidden>
                  {m.icon}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{slot.count}</div>
                <div className="text-xs text-faint">{m.label}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {formatMinutes(minutes)} focused · {rollup.totalXp} XP earned all-time (cosmetic only — never cash).
        </p>
      </Card>

      {/* Reward ledger */}
      <Card className="p-5">
        <h2 className="font-semibold">Reward ledger</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Banked (safe)" value={formatVND(payout.bankedMasteryVND)} sub="never decreases" />
          <Stat
            label="Speed vault"
            value={formatVND(Math.max(0, payout.vault.value))}
            sub={payout.vault.locked ? "locked in" : payout.vault.label}
          />
          <Stat label="Projected total" value={formatVND(payout.projectedTotalVND)} sub={`cap ${formatVND(payout.capVND)}`} />
        </div>
        {payout.vault.penalty > 0 ? (
          <p className="mt-3 text-sm text-danger">Overdue — a {formatVND(payout.vault.penalty)} penalty applies to the final payout.</p>
        ) : null}
        <Link href="/bounty" className="mt-3 inline-block text-sm text-primary hover:underline">
          Full Bounty Board →
        </Link>
      </Card>

      {/* Nintendo ledger */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Nintendo time earned</h2>
          <span className="text-sm text-muted">
            {formatMinutes(nin.thisWeekMin)} this week · {formatMinutes(nin.totalMin)} all-time
          </span>
        </div>
        {progress.nintendo.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No Nintendo time earned yet.</p>
        ) : (
          <ul className="mt-3 grid gap-1 text-sm">
            {[...progress.nintendo].slice(-10).reverse().map((n) => (
              <li key={n.id} className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5">
                <span className="text-muted">
                  {formatShortDate(n.localDate)} · {n.reason}
                </span>
                <span className="font-medium tabular-nums">+{formatMinutes(n.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Boss attempt log */}
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

      {/* Reward tuning */}
      <Card className="p-5">
        <details>
          <summary className="cursor-pointer select-none font-semibold marker:text-faint">
            Tune the reward economy
          </summary>
          <div className="mt-4 border-t border-border pt-4">
            <RewardTuner />
          </div>
        </details>
      </Card>

      {/* Settings */}
      <Card className="p-5">
        <h2 className="font-semibold">Settings</h2>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5 text-sm">
          <span>
            Equipped theme:{" "}
            <span className="font-medium">
              {theme.emoji} {theme.name}
            </span>
            <span className="ml-1 text-xs text-faint">({themesUnlocked} unlocked)</span>
          </span>
          <Link href="/loot" className="text-primary hover:underline">
            Loot Vault →
          </Link>
        </div>

        <label className="mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5 text-sm">
          <span>
            Reduced motion
            <span className="ml-1 text-xs text-faint">— calms animations &amp; theme fades</span>
          </span>
          <input
            type="checkbox"
            checked={progress.settings.reducedMotion}
            onChange={(e) =>
              update((p) => ({ ...p, settings: { ...p.settings, reducedMotion: e.target.checked } }))
            }
            className="h-5 w-5 accent-primary"
          />
        </label>

        <div className="mt-4">
          <h3 className="text-sm font-medium">Change PIN</h3>
          <div className="mt-2 flex gap-2">
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
        </div>
      </Card>
    </div>
  );
}
