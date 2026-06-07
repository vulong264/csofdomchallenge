/**
 * The persisted learner-progress schema. This is the single serialisable shape
 * behind the ProgressStore (localStorage now; DB later). Keep it JSON-safe.
 */
import type { DeepPartial } from "@/lib/util/types";
import type { RewardConfig } from "@/lib/rewards/types";

export type UnitStatus = "locked" | "available" | "in-progress" | "mastered";

/** SM-2 spaced-repetition state for one flashcard. */
export interface ReviewState {
  cardId: string;
  unitId: string;
  ease: number; // ease factor (starts 2.5)
  intervalDays: number;
  repetitions: number;
  dueLocalDate: string;
  lastReviewedLocalDate?: string;
  lapses: number;
}

export interface PerTopicScore {
  topicCode: string;
  correct: number; // marks
  total: number;
}

export interface TestAttempt {
  id: string;
  unitId: string;
  atISO: string; // full timestamp, for ordering
  localDate: string; // YYYY-MM-DD
  score: number; // marks earned
  total: number; // marks available
  percent: number; // 0..100
  passed: boolean;
  flawless: boolean; // passed AND it was the first attempt
  perTopic: PerTopicScore[];
  missedTopicCodes: string[];
}

export interface UnitProgress {
  unitId: string;
  status: UnitStatus;
  lessonsDone: string[];
  bestPercent: number;
  attemptsCount: number;
  flawlessEligible: boolean; // false once a boss attempt has failed
  flawlessAchieved: boolean;
  masteredLocalDate?: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveLocalDate?: string;
  comboPower: number; // 0..100 power meter
}

export interface Cosmetics {
  theme: string;
  unlocked: string[];
}

export interface NintendoEntry {
  id: string;
  localDate: string;
  minutes: number;
  reason: string;
}

export type ActivityKind = "lesson" | "drill" | "review" | "boss-attempt" | "tutor";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  unitId?: string;
  localDate: string;
  atISO: string;
  xp: number;
  durationMs?: number;
}

export interface Settings {
  parentPin: string;
  reducedMotion: boolean;
}

export interface LearnerProgress {
  schemaVersion: number;
  learnerName: string;
  programStartLocalDate: string;
  createdISO: string;
  xp: number;
  level: number;
  streak: Streak;
  units: Record<string, UnitProgress>;
  attempts: TestAttempt[];
  reviews: Record<string, ReviewState>;
  cosmetics: Cosmetics;
  nintendo: NintendoEntry[];
  activity: ActivityEvent[];
  timeOnTaskMs: number;
  settings: Settings;
  /** Parent tuning of the reward economy, deep-merged over the defaults. */
  rewardConfigOverride?: DeepPartial<RewardConfig>;
  /**
   * Wall-clock of the last local mutation (ISO). Drives cross-device sync:
   * when two devices hold copies, the larger `updatedISO` wins. Backfilled to
   * `createdISO` for records written before multi-device sync existed.
   */
  updatedISO: string;
}

export const SCHEMA_VERSION = 1;
