/**
 * The curriculum registry. Add a unit module and list it here — the rest of the
 * app (gating, dashboard, rewards) picks it up with no further changes. Later
 * syllabus topics (4/5/6/8/9) drop in the same way.
 */
import type { Lesson, Unit } from "./types";
import { trainingGrounds } from "./unit-0-training";
import { dataRepresentation } from "./unit-1-data-representation";
import { dataTransmission } from "./unit-2-data-transmission";
import { hardware } from "./unit-3-hardware";
import { booleanLogic } from "./unit-4-boolean-logic";
import { algorithms } from "./unit-5-algorithms";

export const UNITS: Unit[] = [
  trainingGrounds,
  dataRepresentation,
  dataTransmission,
  hardware,
  booleanLogic,
  algorithms,
];

export function orderedUnits(): Unit[] {
  return [...UNITS].sort((a, b) => a.order - b.order);
}

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getLesson(unitId: string, lessonId: string): Lesson | undefined {
  return getUnit(unitId)?.lessons.find((l) => l.id === lessonId);
}

export function rewardUnits(): Unit[] {
  return orderedUnits().filter((u) => u.isRewardSector);
}

export function rewardUnitIds(): string[] {
  return rewardUnits().map((u) => u.id);
}

export type { Unit, Lesson } from "./types";
