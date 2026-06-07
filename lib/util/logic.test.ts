import { describe, it, expect } from "vitest";
import {
  gates,
  evalExpr,
  truthTable,
  outputColumn,
  truthTablesEqual,
  type LogicExpr,
} from "@/lib/util/logic";

describe("gates", () => {
  it("match their definitions", () => {
    expect(gates.not(true)).toBe(false);
    expect(gates.and(true, false)).toBe(false);
    expect(gates.or(false, true)).toBe(true);
    expect(gates.nand(true, true)).toBe(false);
    expect(gates.nor(false, false)).toBe(true);
    expect(gates.xor(true, true)).toBe(false);
    expect(gates.xor(true, false)).toBe(true);
  });
});

describe("truth tables", () => {
  const A: LogicExpr = { op: "var", name: "A" };
  const B: LogicExpr = { op: "var", name: "B" };
  const C: LogicExpr = { op: "var", name: "C" };

  it("XOR over two inputs, standard row order (A is MSB)", () => {
    const xor: LogicExpr = { op: "xor", a: A, b: B };
    expect(outputColumn(xor, ["A", "B"])).toEqual([false, true, true, false]);
  });

  it("enumerates all 8 rows for three inputs in order", () => {
    // A AND (B OR NOT C)
    const expr: LogicExpr = {
      op: "and",
      a: A,
      b: { op: "or", a: B, b: { op: "not", a: C } },
    };
    const rows = truthTable(expr, ["A", "B", "C"]);
    expect(rows).toHaveLength(8);
    // first row is 000, last is 111
    expect(rows[0].inputs).toEqual({ A: false, B: false, C: false });
    expect(rows[7].inputs).toEqual({ A: true, B: true, C: true });
    // A=1,B=0,C=0 -> NOT C = 1 -> OR = 1 -> AND = 1
    expect(evalExpr(expr, { A: true, B: false, C: false })).toBe(true);
    // A=1,B=0,C=1 -> NOT C = 0 -> OR = 0 -> AND = 0
    expect(evalExpr(expr, { A: true, B: false, C: true })).toBe(false);
  });

  it("compares output columns", () => {
    expect(truthTablesEqual([true, false], [true, false])).toBe(true);
    expect(truthTablesEqual([true], [true, false])).toBe(false);
  });
});
