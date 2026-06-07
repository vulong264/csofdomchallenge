/**
 * Boolean logic (IGCSE 0478 §10): gates, an expression AST, truth-table
 * generation and comparison. Circuits are limited to ≤3 inputs / 1 output.
 */

export type BinaryOp = "and" | "or" | "nand" | "nor" | "xor";

export const gates = {
  not: (a: boolean): boolean => !a,
  and: (a: boolean, b: boolean): boolean => a && b,
  or: (a: boolean, b: boolean): boolean => a || b,
  nand: (a: boolean, b: boolean): boolean => !(a && b),
  nor: (a: boolean, b: boolean): boolean => !(a || b),
  xor: (a: boolean, b: boolean): boolean => a !== b,
} as const;

export type LogicExpr =
  | { op: "var"; name: string }
  | { op: "const"; value: boolean }
  | { op: "not"; a: LogicExpr }
  | { op: BinaryOp; a: LogicExpr; b: LogicExpr };

export type Env = Record<string, boolean>;

export function evalExpr(expr: LogicExpr, env: Env): boolean {
  switch (expr.op) {
    case "var": {
      const v = env[expr.name];
      if (v === undefined) throw new Error(`unknown variable ${expr.name}`);
      return v;
    }
    case "const":
      return expr.value;
    case "not":
      return gates.not(evalExpr(expr.a, env));
    default:
      return gates[expr.op](evalExpr(expr.a, env), evalExpr(expr.b, env));
  }
}

export interface TruthRow {
  inputs: Env;
  output: boolean;
}

/**
 * Enumerate all input combinations in standard order — the first variable is
 * the most-significant bit, so rows read 000, 001, 010, … 111.
 */
export function truthTable(expr: LogicExpr, vars: string[]): TruthRow[] {
  const n = vars.length;
  const rows: TruthRow[] = [];
  for (let i = 0; i < 2 ** n; i += 1) {
    const env: Env = {};
    for (let b = 0; b < n; b += 1) {
      env[vars[b]] = Boolean((i >> (n - 1 - b)) & 1);
    }
    rows.push({ inputs: env, output: evalExpr(expr, env) });
  }
  return rows;
}

/** Just the output column, in standard row order. */
export function outputColumn(expr: LogicExpr, vars: string[]): boolean[] {
  return truthTable(expr, vars).map((r) => r.output);
}

export function truthTablesEqual(a: boolean[], b: boolean[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
