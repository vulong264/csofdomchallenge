/**
 * XP, levels and loot (spec §11.1). XP is COSMETIC ONLY and is never
 * convertible to cash — this prevents grinding trivial XP for money. Levels
 * unlock cosmetics; the reward economy lives entirely in lib/rewards.
 */

export const XP_REWARDS = {
  lessonRecall: 20, // completing a lesson's active-recall checkpoint
  drillCorrect: 8,
  drillWrong: 2, // a little for trying — keeps it low-stakes
  reviewCard: 6,
  bossAttempt: 10,
  bossCleared: 100,
  flawless: 50,
} as const;

/** Cumulative XP required to be AT a given level. T(1)=0, T(2)=100, T(3)=300, … */
export function cumulativeXpForLevel(level: number): number {
  const l = Math.max(1, level);
  return 50 * (l - 1) * l;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  xp: number;
  intoLevel: number; // xp earned within the current level
  span: number; // xp between this level and the next
  toNext: number; // xp remaining to level up
  pct: number; // 0..100 progress through the current level
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const span = next - base;
  const intoLevel = xp - base;
  return {
    level,
    xp,
    intoLevel,
    span,
    toNext: next - xp,
    pct: span > 0 ? Math.round((intoLevel / span) * 100) : 0,
  };
}
