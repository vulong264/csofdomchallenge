import { todayISO } from "@/lib/util/dates";
import { SCHEMA_VERSION, type LearnerProgress, type UnitProgress, type UnitStatus } from "./types";

export const DEFAULT_LEARNER_NAME = "Tom";
export const DEFAULT_PARENT_PIN = "1234";

export function defaultUnitProgress(unitId: string, status: UnitStatus = "locked"): UnitProgress {
  return {
    unitId,
    status,
    lessonsDone: [],
    bestPercent: 0,
    attemptsCount: 0,
    flawlessEligible: true,
    flawlessAchieved: false,
  };
}

export function createInitialProgress(opts?: { today?: string; nowISO?: string }): LearnerProgress {
  const today = opts?.today ?? todayISO();
  return {
    schemaVersion: SCHEMA_VERSION,
    learnerName: DEFAULT_LEARNER_NAME,
    programStartLocalDate: today,
    createdISO: opts?.nowISO ?? new Date().toISOString(),
    xp: 0,
    level: 1,
    streak: { current: 0, longest: 0, comboPower: 0 },
    units: {},
    attempts: [],
    reviews: {},
    cosmetics: { theme: "doom", unlocked: ["theme:doom"] },
    nintendo: [],
    activity: [],
    timeOnTaskMs: 0,
    settings: { parentPin: DEFAULT_PARENT_PIN, reducedMotion: false },
  };
}

/**
 * Defensive merge so a loaded/imported blob always has every field, even after
 * a schema bump or a hand-edited export. Unknown extras are dropped.
 */
export function normalizeProgress(input: unknown): LearnerProgress {
  const base = createInitialProgress();
  if (!input || typeof input !== "object") return base;
  const p = input as Partial<LearnerProgress>;
  return {
    ...base,
    ...p,
    schemaVersion: SCHEMA_VERSION,
    learnerName: p.learnerName ?? base.learnerName,
    programStartLocalDate: p.programStartLocalDate ?? base.programStartLocalDate,
    createdISO: p.createdISO ?? base.createdISO,
    streak: { ...base.streak, ...(p.streak ?? {}) },
    cosmetics: { ...base.cosmetics, ...(p.cosmetics ?? {}) },
    settings: { ...base.settings, ...(p.settings ?? {}) },
    units: p.units ?? {},
    attempts: p.attempts ?? [],
    reviews: p.reviews ?? {},
    nintendo: p.nintendo ?? [],
    activity: p.activity ?? [],
    timeOnTaskMs: p.timeOnTaskMs ?? 0,
  };
}
