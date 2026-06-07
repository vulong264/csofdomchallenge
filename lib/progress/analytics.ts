/**
 * Pure read-models over LearnerProgress for the Parent view. No I/O, no Date —
 * everything is derived from the persisted arrays, so the dashboard and tests
 * see the same numbers.
 */
import { weeksElapsed } from "@/lib/util/dates";
import type { ActivityEvent, ActivityKind, TestAttempt } from "./types";

export interface TopicStat {
  topicCode: string;
  correct: number;
  total: number;
  pct: number; // 0..100, 0 when no marks recorded
}

/**
 * Aggregate per-topic marks across every boss attempt, weakest first. A topic's
 * accuracy is its best-known signal of where the learner still needs work.
 */
export function topicBreakdown(attempts: TestAttempt[]): TopicStat[] {
  const acc = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    for (const t of a.perTopic) {
      const cur = acc.get(t.topicCode) ?? { correct: 0, total: 0 };
      cur.correct += t.correct;
      cur.total += t.total;
      acc.set(t.topicCode, cur);
    }
  }
  return [...acc.entries()]
    .map(([topicCode, { correct, total }]) => ({
      topicCode,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct || a.topicCode.localeCompare(b.topicCode));
}

export const ACTIVITY_KINDS: ActivityKind[] = ["lesson", "drill", "review", "boss-attempt", "tutor"];

export interface ActivityRollup {
  byKind: Record<ActivityKind, { count: number; xp: number }>;
  totalEvents: number;
  totalXp: number;
}

export function activityRollup(activity: ActivityEvent[]): ActivityRollup {
  const byKind = Object.fromEntries(
    ACTIVITY_KINDS.map((k) => [k, { count: 0, xp: 0 }]),
  ) as Record<ActivityKind, { count: number; xp: number }>;
  let totalXp = 0;
  for (const e of activity) {
    const slot = byKind[e.kind];
    if (slot) {
      slot.count += 1;
      slot.xp += e.xp;
    }
    totalXp += e.xp;
  }
  return { byKind, totalEvents: activity.length, totalXp };
}

/** Minutes of focused time, rounded, from the persisted millisecond counter. */
export function minutesOnTask(timeOnTaskMs: number): number {
  return Math.round(timeOnTaskMs / 60_000);
}

export interface DayBucket {
  localDate: string;
  count: number;
}

/** Distinct active days with their session counts, most recent last. */
export function activeDays(activity: ActivityEvent[]): DayBucket[] {
  const counts = new Map<string, number>();
  for (const e of activity) counts.set(e.localDate, (counts.get(e.localDate) ?? 0) + 1);
  return [...counts.entries()]
    .map(([localDate, count]) => ({ localDate, count }))
    .sort((a, b) => a.localDate.localeCompare(b.localDate));
}

/** Active days within the current program week (for the weekly bonus check). */
export function activeDaysThisWeek(activity: ActivityEvent[], startLocalDate: string, todayLocalDate: string): number {
  const wk = weeksElapsed(startLocalDate, todayLocalDate);
  const days = new Set<string>();
  for (const e of activity) {
    if (weeksElapsed(startLocalDate, e.localDate) === wk) days.add(e.localDate);
  }
  return days.size;
}
