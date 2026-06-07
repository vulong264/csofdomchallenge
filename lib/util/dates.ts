/**
 * Local-calendar date helpers for streaks and the reward pace tracker.
 * All dates are "YYYY-MM-DD" strings interpreted in the learner's LOCAL time,
 * so "today" matches their wall clock (not UTC).
 */

export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayISO = (): string => localDateISO(new Date());

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return localDateISO(d);
}

/** Whole calendar days from `aISO` to `bISO` (positive if b is later). */
export function daysBetween(aISO: string, bISO: string): number {
  const a = parseISODate(aISO).getTime();
  const b = parseISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

export const isSameDay = (aISO: string, bISO: string): boolean => aISO === bISO;

/** Days since the program start (clamped at 0). */
export function daysSinceStart(startISO: string, asOfISO: string): number {
  return Math.max(0, daysBetween(startISO, asOfISO));
}

/**
 * Zero-based count of FULL weeks elapsed since start.
 * Days 0–6 → 0 (program week 1), 7–13 → 1 (week 2), … 21–27 → 3 (week 4).
 */
export function weeksElapsed(startISO: string, asOfISO: string): number {
  return Math.floor(daysSinceStart(startISO, asOfISO) / 7);
}

/** Human label like "Sun 28 Jun". */
export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
