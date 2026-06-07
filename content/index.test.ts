import { describe, it, expect } from "vitest";
import { UNITS } from "@/content/index";
import type { Question } from "@/lib/domain/questions";

const allQuestions = (): Question[] => UNITS.flatMap((u) => [...u.drill, ...u.masteryTest.questions]);

describe("content integrity", () => {
  it("has at least the tutorial + one reward sector, with unique orders", () => {
    expect(UNITS.length).toBeGreaterThanOrEqual(2);
    const orders = UNITS.map((u) => u.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(UNITS.some((u) => u.isRewardSector)).toBe(true);
    expect(UNITS.some((u) => !u.isRewardSector)).toBe(true); // the tutorial
  });

  it("every unit has lessons with recall checkpoints and a non-empty boss at 80%", () => {
    for (const u of UNITS) {
      expect(u.lessons.length).toBeGreaterThan(0);
      for (const l of u.lessons) expect(l.recall.length).toBeGreaterThan(0);
      expect(u.masteryTest.passThreshold).toBe(0.8);
      expect(u.masteryTest.questions.length).toBeGreaterThan(0);
    }
  });

  it("question ids are globally unique", () => {
    const ids = allQuestions().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every choice-based question references valid choice ids", () => {
    for (const q of allQuestions()) {
      if (q.type === "mcq") {
        expect(q.choices.some((c) => c.id === q.correctId)).toBe(true);
      } else if (q.type === "multi") {
        expect(q.correctIds.every((id) => q.choices.some((c) => c.id === id))).toBe(true);
      } else if (q.type === "order") {
        expect([...q.correctOrder].sort()).toEqual(q.items.map((i) => i.id).sort());
      }
    }
  });
});
