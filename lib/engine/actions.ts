/**
 * Pure progress mutations — the single place state changes when the learner
 * does something. Each returns a NEW LearnerProgress (no mutation), so they're
 * trivially unit-testable. The React context wraps these with persistence and
 * injects `today` + the resolved RewardConfig.
 *
 * Key rule (spec §11.7): failing a boss on the first attempt removes that
 * sector's Flawless eligibility, permanently.
 */
import { addDays } from "@/lib/util/dates";
import { newId } from "@/lib/util/ids";
import { defaultUnitProgress } from "@/lib/progress/defaults";
import type {
  ActivityEvent,
  ActivityKind,
  LearnerProgress,
  NintendoEntry,
  PerTopicScore,
  TestAttempt,
  UnitProgress,
} from "@/lib/progress/types";
import type { RewardConfig } from "@/lib/rewards/types";
import { initReview, scheduleReview, type ReviewGrade } from "@/lib/srs/sm2";
import { registerActivity } from "./streak";
import { levelForXp, XP_REWARDS } from "./xp";

const ensureUnit = (p: LearnerProgress, unitId: string): UnitProgress =>
  p.units[unitId] ?? defaultUnitProgress(unitId, "available");

const activityEvent = (
  kind: ActivityKind,
  unitId: string | undefined,
  xp: number,
  today: string,
  durationMs?: number,
): ActivityEvent => ({
  id: newId("ev"),
  kind,
  unitId,
  localDate: today,
  atISO: new Date().toISOString(),
  xp,
  durationMs,
});

const dailyGranted = (p: LearnerProgress, today: string): boolean =>
  p.nintendo.some((n) => n.localDate === today && n.reason === "Daily session");

/** Grant the same-day Nintendo block the first time a qualifying session happens. */
function withDailySession(nintendo: NintendoEntry[], p: LearnerProgress, today: string, config: RewardConfig): NintendoEntry[] {
  if (dailyGranted(p, today)) return nintendo;
  return [
    ...nintendo,
    { id: newId("nin"), localDate: today, minutes: config.nintendo.dailySessionMin, reason: "Daily session" },
  ];
}

export function completeLesson(
  p: LearnerProgress,
  unitId: string,
  lessonId: string,
  today: string,
  config: RewardConfig,
): LearnerProgress {
  const up = ensureUnit(p, unitId);
  const streak = registerActivity(p.streak, today);
  const nintendo = withDailySession(p.nintendo, p, today, config);

  if (up.lessonsDone.includes(lessonId)) {
    return { ...p, streak, nintendo }; // revisit: activity counts, no double XP
  }

  const xp = p.xp + XP_REWARDS.lessonRecall;
  const newUp: UnitProgress = {
    ...up,
    lessonsDone: [...up.lessonsDone, lessonId],
    status: up.status === "mastered" ? "mastered" : "in-progress",
  };
  return {
    ...p,
    xp,
    level: levelForXp(xp),
    units: { ...p.units, [unitId]: newUp },
    activity: [...p.activity, activityEvent("lesson", unitId, XP_REWARDS.lessonRecall, today)],
    streak,
    nintendo,
  };
}

export function recordDrill(
  p: LearnerProgress,
  unitId: string,
  correct: boolean,
  today: string,
  config: RewardConfig,
): LearnerProgress {
  const gain = correct ? XP_REWARDS.drillCorrect : XP_REWARDS.drillWrong;
  const xp = p.xp + gain;
  return {
    ...p,
    xp,
    level: levelForXp(xp),
    activity: [...p.activity, activityEvent("drill", unitId, gain, today)],
    streak: registerActivity(p.streak, today),
    nintendo: withDailySession(p.nintendo, p, today, config),
  };
}

export interface GradedTest {
  score: number;
  total: number;
  percent: number;
  perTopic: PerTopicScore[];
  missedTopicCodes: string[];
}

export interface AttemptOutcome {
  progress: LearnerProgress;
  attempt: TestAttempt;
  passed: boolean;
  flawless: boolean;
  newlyMastered: boolean;
}

export function recordAttempt(
  p: LearnerProgress,
  unitId: string,
  graded: GradedTest,
  today: string,
  isRewardSector: boolean,
  config: RewardConfig,
): AttemptOutcome {
  const up = ensureUnit(p, unitId);
  const firstAttempt = up.attemptsCount === 0;
  const passed = graded.percent >= 80;
  const wasMastered = up.bestPercent >= 80;
  const flawless = passed && firstAttempt && up.flawlessEligible;
  const newlyMastered = passed && !wasMastered;

  const newUp: UnitProgress = {
    ...up,
    attemptsCount: up.attemptsCount + 1,
    bestPercent: Math.max(up.bestPercent, graded.percent),
    // First-attempt failure permanently forfeits Flawless for this sector.
    flawlessEligible: firstAttempt && !passed ? false : up.flawlessEligible,
    flawlessAchieved: up.flawlessAchieved || flawless,
    status: passed || up.status === "mastered" ? "mastered" : "in-progress",
    masteredLocalDate: up.masteredLocalDate ?? (newlyMastered ? today : undefined),
  };

  const attempt: TestAttempt = {
    id: newId("att"),
    unitId,
    atISO: new Date().toISOString(),
    localDate: today,
    score: graded.score,
    total: graded.total,
    percent: graded.percent,
    passed,
    flawless,
    perTopic: graded.perTopic,
    missedTopicCodes: graded.missedTopicCodes,
  };

  const gain =
    XP_REWARDS.bossAttempt + (passed ? XP_REWARDS.bossCleared : 0) + (flawless ? XP_REWARDS.flawless : 0);
  const xp = p.xp + gain;

  let nintendo = withDailySession(p.nintendo, p, today, config);
  if (newlyMastered && isRewardSector) {
    nintendo = [
      ...nintendo,
      {
        id: newId("nin"),
        localDate: today,
        minutes: config.nintendo.sectorClearMin,
        reason: "Sector cleared",
      },
    ];
  }

  const progress: LearnerProgress = {
    ...p,
    xp,
    level: levelForXp(xp),
    units: { ...p.units, [unitId]: newUp },
    attempts: [...p.attempts, attempt],
    activity: [...p.activity, activityEvent("boss-attempt", unitId, gain, today)],
    streak: registerActivity(p.streak, today),
    nintendo,
  };
  return { progress, attempt, passed, flawless, newlyMastered };
}

export function reviewCard(
  p: LearnerProgress,
  cardId: string,
  unitId: string,
  grade: ReviewGrade,
  today: string,
  config: RewardConfig,
): LearnerProgress {
  const existing = p.reviews[cardId] ?? initReview(cardId, unitId, today);
  const updated = scheduleReview(existing, grade, today);
  const xp = p.xp + XP_REWARDS.reviewCard;
  return {
    ...p,
    reviews: { ...p.reviews, [cardId]: updated },
    xp,
    level: levelForXp(xp),
    activity: [...p.activity, activityEvent("review", unitId, XP_REWARDS.reviewCard, today)],
    streak: registerActivity(p.streak, today),
    nintendo: withDailySession(p.nintendo, p, today, config),
  };
}

/** When a unit is mastered, queue its flashcards as future warm-ups (due tomorrow). */
export function seedReviews(p: LearnerProgress, unitId: string, cardIds: string[], today: string): LearnerProgress {
  const reviews = { ...p.reviews };
  for (const cid of cardIds) {
    if (!reviews[cid]) {
      reviews[cid] = { ...initReview(cid, unitId, today), dueLocalDate: addDays(today, 1) };
    }
  }
  return { ...p, reviews };
}
