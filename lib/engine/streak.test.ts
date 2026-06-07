import { describe, it, expect } from "vitest";
import { registerActivity, currentPower, streakAlive } from "@/lib/engine/streak";
import type { Streak } from "@/lib/progress/types";

const fresh: Streak = { current: 0, longest: 0, comboPower: 0 };

describe("streak + power meter", () => {
  it("starts a streak and tops up the power meter", () => {
    const s = registerActivity(fresh, "2026-06-07");
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
    expect(s.comboPower).toBe(100);
  });

  it("a second session the same day does not double-count", () => {
    const s1 = registerActivity(fresh, "2026-06-07");
    const s2 = registerActivity(s1, "2026-06-07");
    expect(s2.current).toBe(1);
  });

  it("consecutive days extend the streak", () => {
    let s = registerActivity(fresh, "2026-06-07");
    s = registerActivity(s, "2026-06-08");
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it("a skipped day resets the streak but keeps the record", () => {
    let s = registerActivity(fresh, "2026-06-07");
    s = registerActivity(s, "2026-06-08"); // current 2
    s = registerActivity(s, "2026-06-10"); // gap → reset
    expect(s.current).toBe(1);
    expect(s.longest).toBe(2);
  });

  it("power decays with idle days; streak dies after a gap", () => {
    const s = registerActivity(fresh, "2026-06-07");
    expect(currentPower(s, "2026-06-07")).toBe(100);
    expect(currentPower(s, "2026-06-08")).toBe(85);
    expect(currentPower(s, "2026-06-14")).toBe(0);
    expect(streakAlive(s, "2026-06-08")).toBe(true);
    expect(streakAlive(s, "2026-06-09")).toBe(false);
  });
});
