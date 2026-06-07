import { describe, it, expect } from "vitest";
import { createInitialProgress, defaultUnitProgress } from "@/lib/progress/defaults";
import { computeUnitStatus, isUnitUnlocked, unitStatuses } from "@/lib/engine/gating";
import { makeUnit } from "@/lib/engine/_fixtures";

const units = [makeUnit("u1", 1, ["l1", "l2"]), makeUnit("u2", 2, ["l3"]), makeUnit("u3", 3)];

describe("mastery gating", () => {
  it("unlocks only the first unit on a fresh start", () => {
    const p = createInitialProgress();
    expect(computeUnitStatus(units, p, units[0])).toBe("available");
    expect(computeUnitStatus(units, p, units[1])).toBe("locked");
    expect(isUnitUnlocked(units, p, "u2")).toBe(false);
  });

  it("a ≥80% pass masters a unit and unlocks the next", () => {
    const p = createInitialProgress();
    p.units.u1 = { ...defaultUnitProgress("u1", "mastered"), bestPercent: 85 };
    expect(computeUnitStatus(units, p, units[0])).toBe("mastered");
    expect(computeUnitStatus(units, p, units[1])).toBe("available");
    expect(computeUnitStatus(units, p, units[2])).toBe("locked"); // u2 still gates u3
  });

  it("below 80% does not unlock the next unit", () => {
    const p = createInitialProgress();
    p.units.u1 = { ...defaultUnitProgress("u1"), bestPercent: 79, attemptsCount: 1 };
    expect(computeUnitStatus(units, p, units[0])).toBe("in-progress");
    expect(computeUnitStatus(units, p, units[1])).toBe("locked");
  });

  it("marks a started-but-unpassed unit as in-progress", () => {
    const p = createInitialProgress();
    p.units.u1 = { ...defaultUnitProgress("u1"), lessonsDone: ["l1"] };
    expect(computeUnitStatus(units, p, units[0])).toBe("in-progress");
  });

  it("unitStatuses returns every unit in order", () => {
    const p = createInitialProgress();
    const views = unitStatuses(units, p);
    expect(views.map((v) => v.unit.id)).toEqual(["u1", "u2", "u3"]);
    expect(views.map((v) => v.status)).toEqual(["available", "locked", "locked"]);
  });
});
