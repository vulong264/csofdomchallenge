import { describe, it, expect } from "vitest";
import { bubbleSortSteps, linearSearchSteps } from "@/lib/util/algorithms";

describe("bubble sort", () => {
  it("sorts ascending and records every comparison", () => {
    const { steps, sorted } = bubbleSortSteps([5, 3, 8, 1]);
    expect(sorted).toEqual([1, 3, 5, 8]);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.array.length === 4)).toBe(true);
  });
  it("stops early on an already-sorted array (one clean pass)", () => {
    const { steps } = bubbleSortSteps([1, 2, 3, 4]);
    expect(steps.every((s) => s.pass === 0)).toBe(true);
    expect(steps.every((s) => !s.swapped)).toBe(true);
  });
});

describe("linear search", () => {
  it("finds the target index", () => {
    const { foundIndex, steps } = linearSearchSteps([5, 3, 8, 2], 8);
    expect(foundIndex).toBe(2);
    expect(steps[steps.length - 1].match).toBe(true);
  });
  it("returns -1 when absent and checks every element", () => {
    const { foundIndex, steps } = linearSearchSteps([5, 3, 8], 9);
    expect(foundIndex).toBe(-1);
    expect(steps).toHaveLength(3);
  });
});
