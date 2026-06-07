import { describe, expect, it } from "vitest";
import { createInitialProgress } from "@/lib/progress/defaults";
import type { LearnerProgress, UnitProgress } from "@/lib/progress/types";
import {
  cosmeticStats,
  earnedThemeIds,
  getTheme,
  isThemeUnlocked,
  syncUnlockedThemes,
  THEMES,
} from "./themes";

const REWARD_IDS = ["u1", "u2", "u3", "u4", "u5"];

function mastered(flawless = false): UnitProgress {
  return {
    unitId: "x",
    status: "mastered",
    lessonsDone: [],
    bestPercent: 100,
    attemptsCount: 1,
    flawlessEligible: flawless,
    flawlessAchieved: flawless,
  };
}

function progressWith(over: Partial<LearnerProgress>): LearnerProgress {
  return { ...createInitialProgress({ today: "2026-01-01" }), ...over };
}

describe("cosmeticStats", () => {
  it("counts mastered reward sectors and flawless clears", () => {
    const p = progressWith({
      units: { u1: mastered(true), u2: mastered(false), u3: { ...mastered(), status: "in-progress" } },
    });
    const s = cosmeticStats(p, REWARD_IDS);
    expect(s.sectorsMastered).toBe(2);
    expect(s.flawlessCount).toBe(1);
    expect(s.dungeonCleared).toBe(false);
  });

  it("flags dungeonCleared only when every reward sector is mastered", () => {
    const units = Object.fromEntries(REWARD_IDS.map((id) => [id, mastered()]));
    const s = cosmeticStats(progressWith({ units }), REWARD_IDS);
    expect(s.dungeonCleared).toBe(true);
    expect(s.sectorsMastered).toBe(5);
  });
});

describe("earnedThemeIds", () => {
  it("a fresh learner earns only the default theme", () => {
    const s = cosmeticStats(progressWith({}), REWARD_IDS);
    expect(earnedThemeIds(s)).toEqual(["doom"]);
  });

  it("ember unlocks on first sector, gold on first flawless", () => {
    const s = cosmeticStats(progressWith({ units: { u1: mastered(true) } }), REWARD_IDS);
    const ids = earnedThemeIds(s);
    expect(ids).toContain("ember");
    expect(ids).toContain("gold");
    expect(ids).not.toContain("toxic"); // needs 3 sectors
  });

  it("level and streak gate abyss and frost independently", () => {
    expect(earnedThemeIds(cosmeticStats(progressWith({ level: 3 }), REWARD_IDS))).toContain("abyss");
    expect(
      earnedThemeIds(cosmeticStats(progressWith({ streak: { current: 0, longest: 7, comboPower: 0 } }), REWARD_IDS)),
    ).toContain("frost");
  });

  it("void only unlocks on a full dungeon clear", () => {
    const units = Object.fromEntries(REWARD_IDS.map((id) => [id, mastered()]));
    expect(earnedThemeIds(cosmeticStats(progressWith({ units }), REWARD_IDS))).toContain("void");
  });
});

describe("syncUnlockedThemes", () => {
  it("merges newly-earned themes and reports them, monotonically", () => {
    const p = progressWith({ level: 3, units: { u1: mastered(true) } });
    const { progress, newlyUnlocked } = syncUnlockedThemes(p, REWARD_IDS);
    expect(newlyUnlocked).toEqual(expect.arrayContaining(["ember", "abyss", "gold"]));
    expect(progress.cosmetics.unlocked).toContain("theme:ember");
    // Re-running is a no-op (same object, nothing newly unlocked).
    const again = syncUnlockedThemes(progress, REWARD_IDS);
    expect(again.newlyUnlocked).toEqual([]);
    expect(again.progress).toBe(progress);
  });

  it("never removes a previously-unlocked theme", () => {
    const p = progressWith({ cosmetics: { theme: "doom", unlocked: ["theme:doom", "theme:ember"] } });
    const { progress } = syncUnlockedThemes(p, REWARD_IDS);
    expect(progress.cosmetics.unlocked).toContain("theme:ember");
  });
});

describe("isThemeUnlocked / getTheme", () => {
  it("default theme is always considered unlocked", () => {
    expect(isThemeUnlocked(progressWith({}), "doom")).toBe(true);
    expect(isThemeUnlocked(progressWith({}), "void")).toBe(false);
  });

  it("getTheme falls back to the default for an unknown id", () => {
    expect(getTheme("nope").id).toBe("doom");
    expect(getTheme("void").id).toBe("void");
  });

  it("every theme has a swatch with four colours", () => {
    for (const t of THEMES) {
      expect(Object.keys(t.swatch)).toEqual(["bg", "surface", "primary", "accent"]);
    }
  });
});
