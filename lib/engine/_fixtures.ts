/** Test fixtures (not a test file). Builds minimal Units for engine tests. */
import type { Unit } from "@/content/types";

export function makeUnit(id: string, order: number, lessonIds: string[] = [], isRewardSector = true): Unit {
  return {
    id,
    order,
    syllabusRef: `${order}.x`,
    paper: 1,
    title: `Unit ${order}`,
    blurb: "",
    sector: { number: order, name: `Sector ${order}`, boss: `Boss ${order}` },
    isRewardSector,
    lessons: lessonIds.map((lid) => ({
      id: lid,
      unitId: id,
      topicCode: `${order}.1`,
      title: lid,
      summary: "",
      cards: [],
      widgets: [],
      recall: [],
    })),
    flashcards: [],
    drill: [],
    masteryTest: { passThreshold: 0.8, questions: [] },
    tutor: { conceptSummary: "", misconceptions: [] },
  };
}
