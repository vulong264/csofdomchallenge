import { describe, expect, it } from "vitest";
import type { ActivityEvent, TestAttempt } from "./types";
import {
  activeDays,
  activeDaysThisWeek,
  activityRollup,
  minutesOnTask,
  topicBreakdown,
} from "./analytics";

function attempt(over: Partial<TestAttempt>): TestAttempt {
  return {
    id: "a",
    unitId: "u1",
    atISO: "2026-01-01T00:00:00Z",
    localDate: "2026-01-01",
    score: 0,
    total: 0,
    percent: 0,
    passed: false,
    flawless: false,
    perTopic: [],
    missedTopicCodes: [],
    ...over,
  };
}

function ev(over: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: "e",
    kind: "lesson",
    localDate: "2026-01-01",
    atISO: "2026-01-01T00:00:00Z",
    xp: 0,
    ...over,
  };
}

describe("topicBreakdown", () => {
  it("sums marks per topic across attempts and sorts weakest first", () => {
    const rows = topicBreakdown([
      attempt({ perTopic: [{ topicCode: "1.1", correct: 2, total: 2 }, { topicCode: "1.2", correct: 1, total: 4 }] }),
      attempt({ perTopic: [{ topicCode: "1.2", correct: 1, total: 4 }, { topicCode: "1.1", correct: 1, total: 2 }] }),
    ]);
    expect(rows[0]).toMatchObject({ topicCode: "1.2", correct: 2, total: 8, pct: 25 });
    expect(rows[1]).toMatchObject({ topicCode: "1.1", correct: 3, total: 4, pct: 75 });
  });

  it("is empty with no attempts", () => {
    expect(topicBreakdown([])).toEqual([]);
  });
});

describe("activityRollup", () => {
  it("buckets counts and xp by kind", () => {
    const r = activityRollup([
      ev({ kind: "lesson", xp: 20 }),
      ev({ kind: "drill", xp: 8 }),
      ev({ kind: "drill", xp: 2 }),
      ev({ kind: "boss-attempt", xp: 110 }),
    ]);
    expect(r.byKind.drill).toEqual({ count: 2, xp: 10 });
    expect(r.byKind.lesson.count).toBe(1);
    expect(r.totalEvents).toBe(4);
    expect(r.totalXp).toBe(140);
  });
});

describe("minutesOnTask", () => {
  it("rounds milliseconds to whole minutes", () => {
    expect(minutesOnTask(90_000)).toBe(2);
    expect(minutesOnTask(0)).toBe(0);
  });
});

describe("activeDays", () => {
  it("counts sessions per distinct day, chronologically", () => {
    const days = activeDays([
      ev({ localDate: "2026-01-02" }),
      ev({ localDate: "2026-01-01" }),
      ev({ localDate: "2026-01-02" }),
    ]);
    expect(days).toEqual([
      { localDate: "2026-01-01", count: 1 },
      { localDate: "2026-01-02", count: 2 },
    ]);
  });

  it("counts distinct active days in the current program week", () => {
    const start = "2026-01-01";
    const events = [
      ev({ localDate: "2026-01-01" }), // week 1
      ev({ localDate: "2026-01-03" }), // week 1
      ev({ localDate: "2026-01-03" }), // dup day
      ev({ localDate: "2026-01-09" }), // week 2 — excluded
    ];
    expect(activeDaysThisWeek(events, start, "2026-01-05")).toBe(2);
  });
});
