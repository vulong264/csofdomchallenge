import { describe, it, expect } from "vitest";
import {
  countOnes,
  parityBit,
  checkParity,
  rowParities,
  colParities,
  locateSingleBitError,
  type Bit,
} from "@/lib/util/parity";

describe("1D parity", () => {
  it("counts ones from a string or array", () => {
    expect(countOnes("10110")).toBe(3);
    expect(countOnes([1, 0, 1, 1])).toBe(3);
  });
  it("computes the parity bit to satisfy the scheme", () => {
    expect(parityBit("1011", "even")).toBe(1); // 3 ones -> add 1 -> even
    expect(parityBit("1010", "even")).toBe(0); // already even
    expect(parityBit("1011", "odd")).toBe(0); // 3 ones already odd
    expect(parityBit("1010", "odd")).toBe(1);
  });
  it("checks a received unit including its parity bit", () => {
    expect(checkParity("10111", "even")).toBe(true); // four ones
    expect(checkParity("10110", "even")).toBe(false); // a single flip fails
    expect(checkParity("10110", "odd")).toBe(true);
  });
});

describe("2D parity block locates a single flipped bit", () => {
  const grid: Bit[][] = [
    [1, 0, 1, 1],
    [0, 1, 1, 0],
    [1, 1, 0, 0],
  ];
  const scheme = "even" as const;
  const txRow = rowParities(grid, scheme);
  const txCol = colParities(grid, scheme);

  it("computes row and column parities", () => {
    expect(txRow).toEqual([1, 0, 0]); // ones per row: 3,2,2
    expect(txCol).toEqual([0, 0, 0, 1]); // ones per col: 2,2,2,1
  });

  it("pinpoints the row/column intersection of a flipped bit", () => {
    const received: Bit[][] = grid.map((r) => [...r]);
    received[1][2] = received[1][2] === 1 ? 0 : 1; // flip (row 1, col 2)
    expect(locateSingleBitError(received, txRow, txCol, scheme)).toEqual({
      row: 1,
      col: 2,
    });
  });

  it("returns null when parity matches (no detectable single error)", () => {
    expect(locateSingleBitError(grid, txRow, txCol, scheme)).toBeNull();
  });
});
