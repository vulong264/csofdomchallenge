import { describe, it, expect } from "vitest";
import { createInitialProgress } from "@/lib/progress/defaults";
import { DEFAULT_REWARD_CONFIG as CFG } from "@/lib/rewards/config";
import { completeLesson, recordAttempt, type GradedTest } from "@/lib/engine/actions";

const today = "2026-06-10";
const graded = (percent: number): GradedTest => ({
  score: percent,
  total: 100,
  percent,
  perTopic: [],
  missedTopicCodes: [],
});

describe("completeLesson", () => {
  it("records the lesson, awards XP once, and grants the daily Nintendo block", () => {
    const p0 = createInitialProgress({ today });
    const p1 = completeLesson(p0, "u1", "l1", today, CFG);
    expect(p1.units.u1.lessonsDone).toEqual(["l1"]);
    expect(p1.xp).toBeGreaterThan(0);
    expect(p1.streak.current).toBe(1);
    expect(p1.nintendo.some((n) => n.reason === "Daily session")).toBe(true);

    const p2 = completeLesson(p1, "u1", "l1", today, CFG); // revisit
    expect(p2.xp).toBe(p1.xp); // no double XP
    expect(p2.nintendo.length).toBe(p1.nintendo.length); // daily not granted twice
  });
});

describe("recordAttempt — Flawless eligibility", () => {
  it("first-attempt ≥80% is Flawless and masters the sector", () => {
    const p0 = createInitialProgress({ today });
    const out = recordAttempt(p0, "u1", graded(85), today, true, CFG);
    expect(out.passed).toBe(true);
    expect(out.flawless).toBe(true);
    expect(out.newlyMastered).toBe(true);
    const up = out.progress.units.u1;
    expect(up.flawlessAchieved).toBe(true);
    expect(up.bestPercent).toBe(85);
    expect(up.masteredLocalDate).toBe(today);
    expect(out.progress.nintendo.some((n) => n.reason === "Sector cleared")).toBe(true);
  });

  it("a failed first attempt permanently forfeits Flawless, even after a later pass", () => {
    const p0 = createInitialProgress({ today });
    const fail = recordAttempt(p0, "u1", graded(50), today, true, CFG);
    expect(fail.passed).toBe(false);
    expect(fail.progress.units.u1.flawlessEligible).toBe(false);

    const pass = recordAttempt(fail.progress, "u1", graded(90), "2026-06-11", true, CFG);
    expect(pass.passed).toBe(true);
    expect(pass.flawless).toBe(false); // eligibility was lost
    expect(pass.newlyMastered).toBe(true);
    expect(pass.progress.units.u1.flawlessAchieved).toBe(false);
    expect(pass.progress.units.u1.attemptsCount).toBe(2);
  });
});
