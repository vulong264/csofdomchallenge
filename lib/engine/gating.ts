/**
 * Mastery gating (spec §3). A unit unlocks only when the previous unit's boss
 * was passed at ≥80%. Status is always derived from progress + unit order, so
 * it can't drift out of sync.
 */
import type { Unit } from "@/content/types";
import { defaultUnitProgress } from "@/lib/progress/defaults";
import type { LearnerProgress, UnitProgress, UnitStatus } from "@/lib/progress/types";

export const PASS_PERCENT = 80;

export function getUnitProgress(progress: LearnerProgress, unitId: string): UnitProgress {
  return progress.units[unitId] ?? defaultUnitProgress(unitId);
}

export function unitPassed(progress: LearnerProgress, unitId: string): boolean {
  return getUnitProgress(progress, unitId).bestPercent >= PASS_PERCENT;
}

function ordered(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => a.order - b.order);
}

export function computeUnitStatus(units: Unit[], progress: LearnerProgress, unit: Unit): UnitStatus {
  const seq = ordered(units);
  const idx = seq.findIndex((u) => u.id === unit.id);
  const prev = idx > 0 ? seq[idx - 1] : undefined;
  const unlocked = !prev || unitPassed(progress, prev.id);
  if (!unlocked) return "locked";
  if (unitPassed(progress, unit.id)) return "mastered";
  const up = getUnitProgress(progress, unit.id);
  const started = up.lessonsDone.length > 0 || up.attemptsCount > 0;
  return started ? "in-progress" : "available";
}

export function isUnitUnlocked(units: Unit[], progress: LearnerProgress, unitId: string): boolean {
  const unit = units.find((u) => u.id === unitId);
  if (!unit) return false;
  return computeUnitStatus(units, progress, unit) !== "locked";
}

export interface UnitStatusView {
  unit: Unit;
  status: UnitStatus;
  bestPercent: number;
  flawlessEligible: boolean;
  flawlessAchieved: boolean;
}

export function unitStatuses(units: Unit[], progress: LearnerProgress): UnitStatusView[] {
  return ordered(units).map((unit) => {
    const up = getUnitProgress(progress, unit.id);
    return {
      unit,
      status: computeUnitStatus(units, progress, unit),
      bestPercent: up.bestPercent,
      flawlessEligible: up.flawlessEligible,
      flawlessAchieved: up.flawlessAchieved,
    };
  });
}

/** Ensure every unit has a progress entry and refresh its cached `status`. */
export function syncUnitStatuses(units: Unit[], progress: LearnerProgress): LearnerProgress {
  const nextUnits = { ...progress.units };
  for (const u of units) {
    const cur = nextUnits[u.id] ?? defaultUnitProgress(u.id);
    nextUnits[u.id] = { ...cur, status: computeUnitStatus(units, progress, u) };
  }
  return { ...progress, units: nextUnits };
}
