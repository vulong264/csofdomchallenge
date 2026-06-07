/**
 * Interleaving (spec §5.4): from Unit 2 onward, a Boss Fight mixes in a few
 * questions from earlier reward sectors so old material is re-tested. The count
 * comes from the unit's `masteryTest.interleaveFromEarlier`.
 */
import type { Unit } from "@/content/types";
import type { Question } from "@/lib/domain/questions";

export function buildBossQuestions(unit: Unit, allUnits: Unit[]): Question[] {
  const own = unit.masteryTest.questions;
  const count = unit.masteryTest.interleaveFromEarlier ?? 0;
  if (count <= 0) return own;

  const earlier = allUnits
    .filter((u) => u.isRewardSector && u.order < unit.order)
    .sort((a, b) => a.order - b.order)
    .flatMap((u) => u.masteryTest.questions);
  if (earlier.length === 0) return own;

  // Deterministic even spread across the earlier pool.
  const stride = earlier.length / count;
  const seen = new Set(own.map((q) => q.id));
  const interleaved: Question[] = [];
  for (let k = 0; k < count; k += 1) {
    const q = earlier[Math.floor(k * stride) % earlier.length];
    if (!seen.has(q.id)) {
      seen.add(q.id);
      interleaved.push(q);
    }
  }
  return [...own, ...interleaved];
}
