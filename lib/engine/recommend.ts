/**
 * "What do I do next?" — the dashboard's single recommended action (spec §8).
 * Drives the learner forward through the current sector; spaced-repetition
 * warm-ups are surfaced separately on the dashboard.
 */
import type { Unit } from "@/content/types";
import type { LearnerProgress } from "@/lib/progress/types";
import { dueReviews } from "@/lib/srs/sm2";
import { computeUnitStatus, getUnitProgress } from "./gating";

export interface NextAction {
  kind: "learn" | "boss" | "review" | "done";
  label: string;
  reason: string;
  href: string;
  unitId?: string;
  lessonId?: string;
  count?: number;
}

export function dueReviewCount(progress: LearnerProgress, today: string): number {
  return dueReviews(progress.reviews, today).length;
}

export function recommendNext(units: Unit[], progress: LearnerProgress, today: string): NextAction {
  const seq = [...units].sort((a, b) => a.order - b.order);
  const target = seq.find((u) => {
    const s = computeUnitStatus(units, progress, u);
    return s === "available" || s === "in-progress";
  });

  if (target) {
    const up = getUnitProgress(progress, target.id);
    const nextLesson = target.lessons.find((l) => !up.lessonsDone.includes(l.id));
    if (nextLesson) {
      return {
        kind: "learn",
        unitId: target.id,
        lessonId: nextLesson.id,
        href: `/unit/${target.id}/learn?lesson=${nextLesson.id}`,
        label: `Learn: ${nextLesson.title}`,
        reason: `Sector ${target.sector.number} · ${target.title}`,
      };
    }
    return {
      kind: "boss",
      unitId: target.id,
      href: `/unit/${target.id}/test`,
      label: `Boss Fight: ${target.sector.boss}`,
      reason: `Clear ${target.title} to descend to the next sector.`,
    };
  }

  const due = dueReviewCount(progress, today);
  if (due > 0) {
    return {
      kind: "review",
      href: "/warmups",
      count: due,
      label: `${due} warm-up${due > 1 ? "s" : ""} due`,
      reason: "Patrols from cleared sectors — keep your Rank.",
    };
  }
  return { kind: "done", href: "/", label: "Dungeon cleared", reason: "Every sector mastered. Legend." };
}
