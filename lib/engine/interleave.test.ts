import { describe, it, expect } from "vitest";
import { buildBossQuestions } from "@/lib/engine/interleave";
import { makeUnit } from "@/lib/engine/_fixtures";
import type { Question } from "@/lib/domain/questions";

const tf = (id: string): Question => ({
  id,
  unitId: "x",
  topicCode: "1.1",
  prompt: id,
  explanation: "",
  difficulty: "core",
  type: "truefalse",
  answer: true,
});

describe("interleaving earlier-unit questions", () => {
  const u1 = makeUnit("u1", 1);
  u1.masteryTest.questions = [tf("u1-q1"), tf("u1-q2"), tf("u1-q3"), tf("u1-q4")];
  const u2 = makeUnit("u2", 2);
  u2.masteryTest.questions = [tf("u2-q1"), tf("u2-q2"), tf("u2-q3")];
  u2.masteryTest.interleaveFromEarlier = 2;

  it("appends N earlier questions to a later boss", () => {
    const qs = buildBossQuestions(u2, [u1, u2]);
    expect(qs).toHaveLength(5);
    expect(qs.slice(0, 3).map((q) => q.id)).toEqual(["u2-q1", "u2-q2", "u2-q3"]);
    const extra = qs.slice(3).map((q) => q.id);
    expect(extra.every((id) => id.startsWith("u1-"))).toBe(true);
    expect(new Set(qs.map((q) => q.id)).size).toBe(5); // no duplicates
  });

  it("does nothing for the first unit (no earlier pool / no count)", () => {
    expect(buildBossQuestions(u1, [u1, u2])).toHaveLength(4);
  });
});
