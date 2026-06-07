import { describe, it, expect } from "vitest";
import { runPseudocode } from "@/lib/util/pseudocode";

const run = (src: string, inputs: (number | string | boolean)[] = []) => runPseudocode(src, inputs);

describe("pseudocode interpreter", () => {
  it("totals with a FOR loop", () => {
    const r = run(`total ← 0
FOR i ← 1 TO 5
  total ← total + i
NEXT i
OUTPUT total`);
    expect(r.error).toBeUndefined();
    expect(r.output).toEqual(["15"]);
  });

  it("loops with WHILE", () => {
    const r = run(`n ← 1
WHILE n < 4 DO
  OUTPUT n
  n ← n + 1
ENDWHILE`);
    expect(r.output).toEqual(["1", "2", "3"]);
  });

  it("loops with REPEAT…UNTIL", () => {
    const r = run(`n ← 0
REPEAT
  n ← n + 1
UNTIL n = 3
OUTPUT n`);
    expect(r.output).toEqual(["3"]);
  });

  it("branches with IF…ELSE", () => {
    const r = run(`x ← 7
IF x > 5 THEN
  OUTPUT "big"
ELSE
  OUTPUT "small"
ENDIF`);
    expect(r.output).toEqual(["big"]);
  });

  it("handles arrays and INPUT", () => {
    const r = run(`DECLARE A : ARRAY[1:3] OF INTEGER
A[1] ← 10
A[2] ← 20
A[3] ← 30
INPUT k
OUTPUT A[k]`, [2]);
    expect(r.output).toEqual(["20"]);
  });

  it("computes MOD, DIV and concatenates strings", () => {
    const r = run(`total ← 17
OUTPUT "rem = ", total MOD 5
OUTPUT total DIV 5`);
    expect(r.output).toEqual(["rem = 2", "3"]);
  });

  it("records a trace with variable snapshots", () => {
    const r = run(`x ← 5
x ← x + 1`);
    expect(r.trace.length).toBe(2);
    expect(r.trace[1].vars.x).toBe("6");
  });

  it("guards against infinite loops", () => {
    const r = run(`WHILE 1 = 1 DO
  x ← 1
ENDWHILE`);
    expect(r.error).toContain("infinite");
  });
});
