/**
 * Pure reward-economy maths (spec §11.3–11.6). Everything reads from a resolved
 * RewardConfig so the dashboard, pace tracker and Bounty Board reconcile to the
 * same numbers. No I/O, no Date.now — `today` is always passed in.
 *
 * Invariants enforced here and in tests:
 *  - Banked mastery cash is monotone (only grows as sectors clear).
 *  - Only the speed vault decays / penalises; penalty capped per config.
 *  - Projected payout never exceeds totalCapVND.
 */
import { addDays, weeksElapsed } from "@/lib/util/dates";
import type { UnitProgress } from "@/lib/progress/types";
import type { RewardConfig } from "./types";

/** Program week (1-based) for a date: days 0–6 → week 1, 7–13 → week 2, … */
export function programWeekFor(startLocalDate: string, dateLocalDate: string): number {
  return weeksElapsed(startLocalDate, dateLocalDate) + 1;
}

/** Speed-vault contribution for a final-clear in the given program week. */
export function vaultContributionForWeek(programWeek: number, config: RewardConfig): number {
  const { fullVaultEndWeek, targetEndWeek, deadlineWeek } = config.weeks;
  const v = config.speedVault;
  if (programWeek <= fullVaultEndWeek) return v.week4VND;
  if (programWeek <= targetEndWeek) return v.week5VND;
  if (programWeek <= deadlineWeek) return v.week6VND;
  const weeksAfter = programWeek - deadlineWeek;
  const penalty = Math.min(weeksAfter * v.postWeek6PenaltyPerWeekVND, v.postWeek6PenaltyCapVND);
  return -penalty;
}

export type VaultTierName = "full" | "target" | "deadline" | "overdue";

export interface VaultStatus {
  /** Speed contribution (can be negative once past the deadline). */
  value: number;
  /** Positive deduction amount when overdue, else 0. */
  penalty: number;
  programWeek: number;
  tier: VaultTierName;
  label: string;
  /** True once all sectors are cleared — the value is then fixed. */
  locked: boolean;
  effectiveLocalDate: string;
  /** When the tier next decreases (omitted when locked or already at the floor). */
  nextDropLocalDate?: string;
  nextValue?: number;
}

function tierFor(programWeek: number, config: RewardConfig): { tier: VaultTierName; label: string } {
  const { fullVaultEndWeek, targetEndWeek, deadlineWeek } = config.weeks;
  if (programWeek <= fullVaultEndWeek) return { tier: "full", label: "Full vault" };
  if (programWeek <= targetEndWeek) return { tier: "target", label: "Target (week 5)" };
  if (programWeek <= deadlineWeek) return { tier: "deadline", label: "Deadline (week 6)" };
  return { tier: "overdue", label: "Overdue — penalty" };
}

/**
 * Current speed-vault status. If `finalClearLocalDate` is given (all sectors
 * cleared) the value locks to that date's tier; otherwise it reflects "what
 * you'd lock in if you finished today" and the date it next drops.
 */
export function speedVaultStatus(
  config: RewardConfig,
  startLocalDate: string,
  todayLocalDate: string,
  finalClearLocalDate?: string,
): VaultStatus {
  const locked = Boolean(finalClearLocalDate);
  const effective = finalClearLocalDate ?? todayLocalDate;
  const programWeek = programWeekFor(startLocalDate, effective);
  const value = vaultContributionForWeek(programWeek, config);
  const { tier, label } = tierFor(programWeek, config);
  const status: VaultStatus = {
    value,
    penalty: value < 0 ? -value : 0,
    programWeek,
    tier,
    label,
    locked,
    effectiveLocalDate: effective,
  };
  if (!locked) {
    // Scan forward to the next program week whose value actually differs (the
    // next *drop*), not just the next week — early tiers span several weeks.
    const maxWeeksAfter = Math.ceil(
      config.speedVault.postWeek6PenaltyCapVND / config.speedVault.postWeek6PenaltyPerWeekVND,
    );
    const horizon = config.weeks.deadlineWeek + maxWeeksAfter + 1;
    for (let w = programWeek + 1; w <= horizon; w += 1) {
      const nv = vaultContributionForWeek(w, config);
      if (nv !== value) {
        // Program week `w` begins `(w - 1) * 7` days after start.
        status.nextDropLocalDate = addDays(startLocalDate, (w - 1) * 7);
        status.nextValue = nv;
        break;
      }
    }
  }
  return status;
}

/** Display rows for the vault decay schedule (Bounty Board). */
export interface VaultTierRow {
  tier: VaultTierName;
  label: string;
  value: number;
  /** Last local date this tier is still available (inclusive). */
  untilLocalDate: string;
}

export function vaultTiers(config: RewardConfig, startLocalDate: string): VaultTierRow[] {
  const { fullVaultEndWeek, targetEndWeek, deadlineWeek } = config.weeks;
  const lastDayOfWeek = (w: number) => addDays(startLocalDate, w * 7 - 1);
  return [
    { tier: "full", label: `By end of week ${fullVaultEndWeek}`, value: config.speedVault.week4VND, untilLocalDate: lastDayOfWeek(fullVaultEndWeek) },
    { tier: "target", label: `End of week ${targetEndWeek}`, value: config.speedVault.week5VND, untilLocalDate: lastDayOfWeek(targetEndWeek) },
    { tier: "deadline", label: `End of week ${deadlineWeek}`, value: config.speedVault.week6VND, untilLocalDate: lastDayOfWeek(deadlineWeek) },
  ];
}

export interface MasteryResult {
  sectorsCleared: number;
  flawlessCount: number;
  bankedVND: number;
}

/** Banked mastery cash — monotone: it only grows as reward sectors are mastered. */
export function masteryBanked(
  units: Record<string, UnitProgress>,
  rewardUnitIds: string[],
  config: RewardConfig,
): MasteryResult {
  let sectorsCleared = 0;
  let flawlessCount = 0;
  for (const id of rewardUnitIds) {
    const up = units[id];
    if (up && up.status === "mastered") {
      sectorsCleared += 1;
      if (up.flawlessAchieved) flawlessCount += 1;
    }
  }
  const bankedVND =
    sectorsCleared * config.mastery.perSectorVND + flawlessCount * config.mastery.flawlessBonusVND;
  return { sectorsCleared, flawlessCount, bankedVND };
}

/** The date the final reward boss fell, or undefined if any remain. */
export function finalClearLocalDate(
  units: Record<string, UnitProgress>,
  rewardUnitIds: string[],
): string | undefined {
  let latest: string | undefined;
  for (const id of rewardUnitIds) {
    const up = units[id];
    if (!up || up.status !== "mastered" || !up.masteredLocalDate) return undefined;
    if (!latest || up.masteredLocalDate > latest) latest = up.masteredLocalDate;
  }
  return rewardUnitIds.length > 0 ? latest : undefined;
}

export interface PayoutResult {
  bankedMasteryVND: number;
  /** Optimistic mastery if every remaining sector is cleared (flawless where still possible). */
  projectedMasteryVND: number;
  vault: VaultStatus;
  allCleared: boolean;
  /** Projected total at the current pace, capped at totalCapVND. */
  projectedTotalVND: number;
  /** Still on the table from here (projected − already banked). */
  remainingVND: number;
  capVND: number;
}

export function projectedPayout(
  units: Record<string, UnitProgress>,
  rewardUnitIds: string[],
  config: RewardConfig,
  startLocalDate: string,
  todayLocalDate: string,
): PayoutResult {
  const banked = masteryBanked(units, rewardUnitIds, config);
  const cleared = finalClearLocalDate(units, rewardUnitIds);
  const allCleared = banked.sectorsCleared === rewardUnitIds.length && rewardUnitIds.length > 0;
  const vault = speedVaultStatus(config, startLocalDate, todayLocalDate, allCleared ? cleared : undefined);

  // Optimistic mastery projection: assume remaining sectors get cleared, flawless
  // where still possible (already flawless, or not yet failed).
  let flawlessProjected = 0;
  for (const id of rewardUnitIds) {
    const up = units[id];
    if (up?.flawlessAchieved) flawlessProjected += 1;
    else if ((!up || up.status !== "mastered") && (up?.flawlessEligible ?? true)) flawlessProjected += 1;
  }
  const projectedMasteryVND =
    rewardUnitIds.length * config.mastery.perSectorVND + flawlessProjected * config.mastery.flawlessBonusVND;

  const vaultPositive = Math.max(0, vault.value);
  const raw = projectedMasteryVND + vaultPositive - vault.penalty;
  const projectedTotalVND = Math.max(0, Math.min(config.totalCapVND, raw));

  return {
    bankedMasteryVND: banked.bankedVND,
    projectedMasteryVND,
    vault,
    allCleared,
    projectedTotalVND,
    remainingVND: Math.max(0, projectedTotalVND - banked.bankedVND),
    capVND: config.totalCapVND,
  };
}

export interface NintendoTotals {
  totalMin: number;
  thisWeekMin: number;
}

export function nintendoTotals(
  entries: { localDate: string; minutes: number }[],
  startLocalDate: string,
  todayLocalDate: string,
): NintendoTotals {
  const thisWeek = weeksElapsed(startLocalDate, todayLocalDate);
  let totalMin = 0;
  let thisWeekMin = 0;
  for (const e of entries) {
    totalMin += e.minutes;
    if (weeksElapsed(startLocalDate, e.localDate) === thisWeek) thisWeekMin += e.minutes;
  }
  return { totalMin, thisWeekMin };
}
