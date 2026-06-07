/**
 * Daily streak + the "Power Meter" combo (spec §11.1). Rewards consistency, not
 * speed: showing up on consecutive days grows the streak; a lapsed day resets
 * it and the power meter decays.
 */
import { daysBetween } from "@/lib/util/dates";
import type { Streak } from "@/lib/progress/types";

export const POWER_DECAY_PER_DAY = 15;

/** Record activity for `today`, advancing or resetting the streak. */
export function registerActivity(streak: Streak, today: string): Streak {
  if (streak.lastActiveLocalDate === today) {
    return { ...streak, comboPower: 100 }; // already counted today; top up the meter
  }
  const consecutive =
    streak.lastActiveLocalDate !== undefined && daysBetween(streak.lastActiveLocalDate, today) === 1;
  const current = consecutive ? streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveLocalDate: today,
    comboPower: 100,
  };
}

/** The streak is still alive if the last active day was today or yesterday. */
export function streakAlive(streak: Streak, today: string): boolean {
  if (!streak.lastActiveLocalDate) return false;
  return daysBetween(streak.lastActiveLocalDate, today) <= 1;
}

/** Current power-meter value, decaying for each day since the last session. */
export function currentPower(streak: Streak, today: string): number {
  if (!streak.lastActiveLocalDate) return 0;
  const days = Math.max(0, daysBetween(streak.lastActiveLocalDate, today));
  return Math.max(0, Math.round(streak.comboPower - days * POWER_DECAY_PER_DAY));
}

/** Whether the learner has already had an active session today. */
export function activeToday(streak: Streak, today: string): boolean {
  return streak.lastActiveLocalDate === today;
}
