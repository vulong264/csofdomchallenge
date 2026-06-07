/**
 * A small interpreter for a subset of Cambridge 0478 pseudocode (§7), used by
 * the step-runner widget. It runs a program to completion and records a trace
 * (the executed line + a variable snapshot at each step), which the UI plays
 * back. Supported: DECLARE, ← assignment, 1-D arrays, INPUT, OUTPUT,
 * IF/ELSE/ENDIF, FOR/NEXT (with STEP), WHILE/ENDWHILE, REPEAT/UNTIL, and the
 * operators + - * / ^ MOD DIV, relational = <> < <= > >=, and AND OR NOT.
 */

export type PValue = number | string | boolean;

export interface TraceStep {
  line: number; // 1-based source line just executed
  vars: Record<string, string>;
  output: string[];
}

export interface RunResult {
  trace: TraceStep[];
  output: string[];
  error?: string;
}

// ── Tokens ──────────────────────────────────────────────────────────────────
type Tok = { k: "num" | "str" | "id" | "op"; v: string };

// Keywords aren't lexed specially — they're `id` tokens recognised by the
// parser by value (e.g. THEN, DO, MOD), so identifiers and keywords share a kind.

function tokenize(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const s = line;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i += 1;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") break; // line comment
    if (c === "←") {
      toks.push({ k: "op", v: "<-" });
      i += 1;
      continue;
    }
    if (c === "<" && s[i + 1] === "-") {
      toks.push({ k: "op", v: "<-" });
      i += 2;
      continue;
    }
    if (c === "<" && s[i + 1] === "=") {
      toks.push({ k: "op", v: "<=" });
      i += 2;
      continue;
    }
    if (c === ">" && s[i + 1] === "=") {
      toks.push({ k: "op", v: ">=" });
      i += 2;
      continue;
    }
    if (c === "<" && s[i + 1] === ">") {
      toks.push({ k: "op", v: "<>" });
      i += 2;
      continue;
    }
    if ("+-*/^()[],:=<>".includes(c)) {
      toks.push({ k: "op", v: c });
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let str = "";
      while (j < s.length && s[j] !== c) {
        str += s[j];
        j += 1;
      }
      toks.push({ k: "str", v: str });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      toks.push({ k: "num", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j += 1;
      toks.push({ k: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return toks;
}

// ── Expressions ─────────────────────────────────────────────────────────────
type Expr =
  | { t: "lit"; v: PValue }
  | { t: "var"; name: string }
  | { t: "index"; name: string; idx: Expr }
  | { t: "un"; op: string; a: Expr }
  | { t: "bin"; op: string; a: Expr; b: Expr };

class ExprParser {
  private p = 0;
  constructor(private toks: Tok[]) {}
  private peek() {
    return this.toks[this.p];
  }
  private eat() {
    return this.toks[this.p++];
  }
  private isOp(v: string) {
    const t = this.peek();
    return t && t.k === "op" && t.v === v;
  }
  private isKw(v: string) {
    const t = this.peek();
    return t && t.k === "id" && t.v === v;
  }
  parse(): Expr {
    const e = this.parseOr();
    if (this.p !== this.toks.length) throw new Error("trailing tokens in expression");
    return e;
  }
  private parseOr(): Expr {
    let a = this.parseAnd();
    while (this.isKw("OR")) {
      this.eat();
      a = { t: "bin", op: "OR", a, b: this.parseAnd() };
    }
    return a;
  }
  private parseAnd(): Expr {
    let a = this.parseNot();
    while (this.isKw("AND")) {
      this.eat();
      a = { t: "bin", op: "AND", a, b: this.parseNot() };
    }
    return a;
  }
  private parseNot(): Expr {
    if (this.isKw("NOT")) {
      this.eat();
      return { t: "un", op: "NOT", a: this.parseNot() };
    }
    return this.parseCompare();
  }
  private parseCompare(): Expr {
    let a = this.parseAdd();
    while (this.peek() && this.peek().k === "op" && ["=", "<>", "<", "<=", ">", ">="].includes(this.peek().v)) {
      const op = this.eat().v;
      a = { t: "bin", op, a, b: this.parseAdd() };
    }
    return a;
  }
  private parseAdd(): Expr {
    let a = this.parseMul();
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.eat().v;
      a = { t: "bin", op, a, b: this.parseMul() };
    }
    return a;
  }
  private parseMul(): Expr {
    let a = this.parsePow();
    while (this.isOp("*") || this.isOp("/") || this.isKw("MOD") || this.isKw("DIV")) {
      const op = this.eat().v;
      a = { t: "bin", op, a, b: this.parsePow() };
    }
    return a;
  }
  private parsePow(): Expr {
    const a = this.parseUnary();
    if (this.isOp("^")) {
      this.eat();
      return { t: "bin", op: "^", a, b: this.parsePow() };
    }
    return a;
  }
  private parseUnary(): Expr {
    if (this.isOp("-")) {
      this.eat();
      return { t: "un", op: "-", a: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  private parsePrimary(): Expr {
    const t = this.peek();
    if (!t) throw new Error("unexpected end of expression");
    if (this.isOp("(")) {
      this.eat();
      const e = this.parseOr();
      if (!this.isOp(")")) throw new Error("missing )");
      this.eat();
      return e;
    }
    if (t.k === "num") {
      this.eat();
      return { t: "lit", v: Number(t.v) };
    }
    if (t.k === "str") {
      this.eat();
      return { t: "lit", v: t.v };
    }
    if (t.k === "id") {
      if (t.v === "TRUE" || t.v === "FALSE") {
        this.eat();
        return { t: "lit", v: t.v === "TRUE" };
      }
      this.eat();
      if (this.isOp("[")) {
        this.eat();
        const idx = this.parseOr();
        if (!this.isOp("]")) throw new Error("missing ]");
        this.eat();
        return { t: "index", name: t.v, idx };
      }
      return { t: "var", name: t.v };
    }
    throw new Error(`unexpected token "${t.v}"`);
  }
}

const parseExpr = (toks: Tok[]): Expr => new ExprParser(toks).parse();

// ── Statements ──────────────────────────────────────────────────────────────
interface LineTok {
  line: number;
  toks: Tok[];
}
type Stmt =
  | { t: "declareArr"; name: string; lo: number; hi: number; line: number }
  | { t: "noop"; line: number }
  | { t: "assign"; name: string; idx?: Expr; expr: Expr; line: number }
  | { t: "input"; name: string; idx?: Expr; line: number }
  | { t: "output"; exprs: Expr[]; line: number }
  | { t: "if"; cond: Expr; then: Stmt[]; els: Stmt[]; line: number }
  | { t: "for"; v: string; from: Expr; to: Expr; step: Expr; body: Stmt[]; line: number }
  | { t: "while"; cond: Expr; body: Stmt[]; line: number }
  | { t: "repeat"; body: Stmt[]; cond: Expr; line: number };

class StmtParser {
  private i = 0;
  constructor(private lines: LineTok[]) {}
  private cur() {
    return this.lines[this.i];
  }
  private headKw(lt: LineTok) {
    return lt.toks[0]?.k === "id" ? lt.toks[0].v : "";
  }
  parseBlock(stop: string[]): Stmt[] {
    const out: Stmt[] = [];
    while (this.i < this.lines.length) {
      const lt = this.cur();
      if (lt.toks.length === 0) {
        this.i += 1;
        continue;
      }
      if (stop.includes(this.headKw(lt))) break;
      out.push(this.parseStmt());
    }
    return out;
  }
  private parseStmt(): Stmt {
    const lt = this.cur();
    const { toks, line } = lt;
    const kw = this.headKw(lt);
    const after = toks.slice(1);

    if (kw === "DECLARE") {
      this.i += 1;
      // DECLARE name : ARRAY[lo:hi] OF TYPE  (arrays tracked; scalars are noops)
      const arrIdx = after.findIndex((t) => t.k === "id" && t.v === "ARRAY");
      if (arrIdx >= 0) {
        const lb = after.findIndex((t) => t.v === "[");
        const colon = after.findIndex((t, k) => k > lb && t.v === ":");
        const lo = Number(after[lb + 1].v);
        const hi = Number(after[colon + 1].v);
        return { t: "declareArr", name: after[0].v, lo, hi, line };
      }
      return { t: "noop", line };
    }
    if (kw === "CONSTANT") {
      // CONSTANT name = value  → treat as assignment
      this.i += 1;
      const eq = after.findIndex((t) => t.v === "=");
      return { t: "assign", name: after[0].v, expr: parseExpr(after.slice(eq + 1)), line };
    }
    if (kw === "INPUT") {
      this.i += 1;
      const target = this.lvalue(after);
      return { t: "input", name: target.name, idx: target.idx, line };
    }
    if (kw === "OUTPUT") {
      this.i += 1;
      return { t: "output", exprs: this.splitArgs(after).map(parseExpr), line };
    }
    if (kw === "IF") {
      this.i += 1;
      const thenIdx = after.findIndex((t) => t.k === "id" && t.v === "THEN");
      const cond = parseExpr(after.slice(0, thenIdx >= 0 ? thenIdx : after.length));
      const then = this.parseBlock(["ELSE", "ENDIF"]);
      let els: Stmt[] = [];
      if (this.cur() && this.headKw(this.cur()) === "ELSE") {
        this.i += 1;
        els = this.parseBlock(["ENDIF"]);
      }
      this.i += 1; // consume ENDIF
      return { t: "if", cond, then, els, line };
    }
    if (kw === "FOR") {
      this.i += 1;
      const arrow = after.findIndex((t) => t.v === "<-");
      const toI = after.findIndex((t) => t.k === "id" && t.v === "TO");
      const stepI = after.findIndex((t) => t.k === "id" && t.v === "STEP");
      const v = after[0].v;
      const from = parseExpr(after.slice(arrow + 1, toI));
      const to = parseExpr(after.slice(toI + 1, stepI >= 0 ? stepI : after.length));
      const step: Expr = stepI >= 0 ? parseExpr(after.slice(stepI + 1)) : { t: "lit", v: 1 };
      const body = this.parseBlock(["NEXT"]);
      this.i += 1; // consume NEXT
      return { t: "for", v, from, to, step, body, line };
    }
    if (kw === "WHILE") {
      this.i += 1;
      const doI = after.findIndex((t) => t.k === "id" && t.v === "DO");
      const cond = parseExpr(after.slice(0, doI >= 0 ? doI : after.length));
      const body = this.parseBlock(["ENDWHILE"]);
      this.i += 1;
      return { t: "while", cond, body, line };
    }
    if (kw === "REPEAT") {
      this.i += 1;
      const body = this.parseBlock(["UNTIL"]);
      const untilLine = this.cur();
      this.i += 1;
      const cond = parseExpr(untilLine.toks.slice(1));
      return { t: "repeat", body, cond, line };
    }
    // assignment: name [ idx ] <- expr
    const arrow = toks.findIndex((t) => t.v === "<-");
    if (arrow > 0) {
      this.i += 1;
      const target = this.lvalue(toks.slice(0, arrow));
      return { t: "assign", name: target.name, idx: target.idx, expr: parseExpr(toks.slice(arrow + 1)), line };
    }
    throw new Error(`line ${line}: can't parse "${toks.map((t) => t.v).join(" ")}"`);
  }
  private lvalue(toks: Tok[]): { name: string; idx?: Expr } {
    const name = toks[0].v;
    if (toks[1]?.v === "[") {
      const rb = toks.findIndex((t) => t.v === "]");
      return { name, idx: parseExpr(toks.slice(2, rb)) };
    }
    return { name };
  }
  private splitArgs(toks: Tok[]): Tok[][] {
    const args: Tok[][] = [];
    let cur: Tok[] = [];
    let depth = 0;
    for (const t of toks) {
      if (t.v === "(" || t.v === "[") depth += 1;
      if (t.v === ")" || t.v === "]") depth -= 1;
      if (t.v === "," && depth === 0) {
        args.push(cur);
        cur = [];
      } else cur.push(t);
    }
    if (cur.length) args.push(cur);
    return args;
  }
}

// ── Interpreter ─────────────────────────────────────────────────────────────
const fmt = (v: PValue): string => (typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v));

export function runPseudocode(source: string, inputs: PValue[] = []): RunResult {
  const lines: LineTok[] = source.split("\n").map((raw, idx) => ({ line: idx + 1, toks: tokenize(raw) }));
  const scalars = new Map<string, PValue>();
  const arrays = new Map<string, { lo: number; values: PValue[] }>();
  const trace: TraceStep[] = [];
  const output: string[] = [];
  const inQueue = [...inputs];
  let steps = 0;
  const MAX = 2000;

  const snapshot = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of scalars) out[k] = fmt(v);
    for (const [k, a] of arrays) out[k] = `[${a.values.map(fmt).join(", ")}]`;
    return out;
  };
  const record = (line: number) => {
    trace.push({ line, vars: snapshot(), output: [...output] });
    steps += 1;
    if (steps > MAX) throw new Error("too many steps (possible infinite loop)");
  };

  const evalExpr = (e: Expr): PValue => {
    switch (e.t) {
      case "lit":
        return e.v;
      case "var": {
        if (!scalars.has(e.name)) throw new Error(`unknown variable ${e.name}`);
        return scalars.get(e.name)!;
      }
      case "index": {
        const arr = arrays.get(e.name);
        if (!arr) throw new Error(`unknown array ${e.name}`);
        const i = Number(evalExpr(e.idx));
        return arr.values[i - arr.lo];
      }
      case "un": {
        const a = evalExpr(e.a);
        if (e.op === "-") return -Number(a);
        return !(a as boolean);
      }
      case "bin": {
        const a = evalExpr(e.a);
        const b = evalExpr(e.b);
        switch (e.op) {
          case "+":
            return typeof a === "string" || typeof b === "string" ? fmt(a) + fmt(b) : Number(a) + Number(b);
          case "-":
            return Number(a) - Number(b);
          case "*":
            return Number(a) * Number(b);
          case "/":
            return Number(a) / Number(b);
          case "^":
            return Number(a) ** Number(b);
          case "MOD":
            return Number(a) % Number(b);
          case "DIV":
            return Math.floor(Number(a) / Number(b));
          case "=":
            return a === b;
          case "<>":
            return a !== b;
          case "<":
            return Number(a) < Number(b);
          case "<=":
            return Number(a) <= Number(b);
          case ">":
            return Number(a) > Number(b);
          case ">=":
            return Number(a) >= Number(b);
          case "AND":
            return Boolean(a) && Boolean(b);
          case "OR":
            return Boolean(a) || Boolean(b);
          default:
            throw new Error(`bad operator ${e.op}`);
        }
      }
    }
  };

  const assign = (name: string, idx: Expr | undefined, value: PValue) => {
    if (idx) {
      const arr = arrays.get(name);
      if (!arr) throw new Error(`unknown array ${name}`);
      arr.values[Number(evalExpr(idx)) - arr.lo] = value;
    } else scalars.set(name, value);
  };

  const exec = (stmts: Stmt[]) => {
    for (const s of stmts) {
      switch (s.t) {
        case "noop":
          break;
        case "declareArr":
          arrays.set(s.name, { lo: s.lo, values: Array(s.hi - s.lo + 1).fill(0) });
          break;
        case "assign":
          assign(s.name, s.idx, evalExpr(s.expr));
          record(s.line);
          break;
        case "input": {
          const v = inQueue.length ? inQueue.shift()! : 0;
          assign(s.name, s.idx, v);
          record(s.line);
          break;
        }
        case "output":
          output.push(s.exprs.map((e) => fmt(evalExpr(e))).join(""));
          record(s.line);
          break;
        case "if":
          record(s.line);
          if (evalExpr(s.cond)) exec(s.then);
          else exec(s.els);
          break;
        case "for": {
          const to = Number(evalExpr(s.to));
          const step = Number(evalExpr(s.step));
          for (let v = Number(evalExpr(s.from)); step > 0 ? v <= to : v >= to; v += step) {
            scalars.set(s.v, v);
            record(s.line);
            exec(s.body);
          }
          break;
        }
        case "while":
          record(s.line);
          while (evalExpr(s.cond)) {
            exec(s.body);
            record(s.line);
          }
          break;
        case "repeat":
          do {
            exec(s.body);
            record(s.line);
          } while (!evalExpr(s.cond));
          break;
      }
    }
  };

  try {
    const program = new StmtParser(lines).parseBlock([]);
    exec(program);
    return { trace, output };
  } catch (err) {
    return { trace, output, error: err instanceof Error ? err.message : "run error" };
  }
}
