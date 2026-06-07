/**
 * SM-2-style spaced repetition (spec §5.3). Cards from mastered units resurface
 * as dashboard "warm-ups" so old material doesn't decay — the antidote to the
 * exact problem we're solving (he forgot everything).
 *
 * Learner-facing grades map to SM-2 quality scores: again=0, hard=3, good=4,
 * easy=5. A grade below 3 is a lapse (resets the interval).
 */
import { addDays, daysBetween } from "@/lib/util/dates";
import type { ReviewState } from "@/lib/progress/types";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const QUALITY: Record<ReviewGrade, number> = { again: 0, hard: 3, good: 4, easy: 5 };

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

export function initReview(cardId: string, unitId: string, today: string): ReviewState {
  return {
    cardId,
    unitId,
    ease: INITIAL_EASE,
    intervalDays: 0,
    repetitions: 0,
    dueLocalDate: today, // due immediately on first sight
    lapses: 0,
  };
}

export function scheduleReview(state: ReviewState, grade: ReviewGrade, today: string): ReviewState {
  const q = QUALITY[grade];
  let { intervalDays, repetitions, lapses } = state;
  let ease = state.ease;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }

  // Standard SM-2 ease update, floored at 1.3.
  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return {
    ...state,
    ease: Number(ease.toFixed(2)),
    intervalDays,
    repetitions,
    lapses,
    lastReviewedLocalDate: today,
    dueLocalDate: addDays(today, intervalDays),
  };
}

/** Due if its due date is today or in the past. */
export function isDue(state: ReviewState, today: string): boolean {
  return daysBetween(state.dueLocalDate, today) >= 0;
}

/** All due reviews, soonest-due first. */
export function dueReviews(reviews: Record<string, ReviewState>, today: string): ReviewState[] {
  return Object.values(reviews)
    .filter((r) => isDue(r, today))
    .sort((a, b) => (a.dueLocalDate < b.dueLocalDate ? -1 : a.dueLocalDate > b.dueLocalDate ? 1 : 0));
}
