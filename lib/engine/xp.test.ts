import { describe, it, expect } from "vitest";
import { cumulativeXpForLevel, levelForXp, levelProgress } from "@/lib/engine/xp";

describe("XP / levels", () => {
  it("cumulative thresholds grow", () => {
    expect(cumulativeXpForLevel(1)).toBe(0);
    expect(cumulativeXpForLevel(2)).toBe(100);
    expect(cumulativeXpForLevel(3)).toBe(300);
    expect(cumulativeXpForLevel(4)).toBe(600);
  });

  it("maps XP to a level", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });

  it("reports progress through the current level", () => {
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(50);
    expect(p.span).toBe(200);
    expect(p.toNext).toBe(150);
    expect(p.pct).toBe(25);
  });
});
