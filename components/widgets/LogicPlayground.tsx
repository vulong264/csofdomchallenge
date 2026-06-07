"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { evalExpr, outputColumn, truthTablesEqual, type LogicExpr } from "@/lib/util/logic";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const GATES = ["and", "or", "nand", "nor", "xor"] as const;
type Gate = (typeof GATES)[number];
const VARS = ["A", "B", "C"];

interface Config {
  g1: Gate;
  g2: Gate;
  notA: boolean;
  notB: boolean;
  notC: boolean;
}

// Fixed topology that covers ≤3-input/1-output circuits: ((A g1 B) g2 C).
function toExpr(c: Config): LogicExpr {
  const v = (name: string, neg: boolean): LogicExpr => (neg ? { op: "not", a: { op: "var", name } } : { op: "var", name });
  return { op: c.g2, a: { op: c.g1, a: v("A", c.notA), b: v("B", c.notB) }, b: v("C", c.notC) };
}
const exprString = (c: Config) => {
  const lit = (n: string, neg: boolean) => (neg ? `(NOT ${n})` : n);
  return `(${lit("A", c.notA)} ${c.g1.toUpperCase()} ${lit("B", c.notB)}) ${c.g2.toUpperCase()} ${lit("C", c.notC)}`;
};
const randomConfig = (): Config => ({
  g1: GATES[Math.floor(Math.random() * GATES.length)],
  g2: GATES[Math.floor(Math.random() * GATES.length)],
  notA: Math.random() < 0.4,
  notB: Math.random() < 0.4,
  notC: Math.random() < 0.4,
});

export function LogicPlayground() {
  const [cfg, setCfg] = useState<Config>({ g1: "and", g2: "or", notA: false, notB: false, notC: false });
  const [inputs, setInputs] = useState({ A: false, B: false, C: false });
  const [target, setTarget] = useState<boolean[] | null>(null);
  const [result, setResult] = useState<"win" | "miss" | null>(null);

  const expr = toExpr(cfg);
  const out = evalExpr(expr, inputs);
  const column = outputColumn(expr, VARS);
  const rowIndex = (inputs.A ? 4 : 0) + (inputs.B ? 2 : 0) + (inputs.C ? 1 : 0);

  const newTarget = () => {
    setTarget(outputColumn(toExpr(randomConfig()), VARS));
    setResult(null);
  };
  const check = () => setResult(target && truthTablesEqual(column, target) ? "win" : "miss");

  return (
    <WidgetShell>
      {/* inputs */}
      <div className="flex items-center justify-center gap-2">
        {VARS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setInputs((s) => ({ ...s, [v]: !s[v as keyof typeof s] }))}
            className={cn(
              "h-10 w-12 rounded-lg border font-mono text-lg",
              inputs[v as keyof typeof inputs] ? "border-primary bg-primary/15 text-text" : "border-border bg-surface text-muted",
            )}
          >
            {v}={inputs[v as keyof typeof inputs] ? 1 : 0}
          </button>
        ))}
        <span className="mx-1 text-muted">→</span>
        <div className={cn("grid h-10 w-12 place-items-center rounded-lg border font-mono text-lg", out ? "border-accent bg-accent/15 text-accent" : "border-border bg-surface text-muted")}>
          {out ? 1 : 0}
        </div>
      </div>

      {/* gate config */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-faint">Gate 1 (A,B)</span>
          <select
            value={cfg.g1}
            onChange={(e) => setCfg((c) => ({ ...c, g1: e.target.value as Gate }))}
            className="flex-1 rounded border border-border bg-surface px-2 py-1 uppercase"
          >
            {GATES.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-faint">Gate 2 (·,C)</span>
          <select
            value={cfg.g2}
            onChange={(e) => setCfg((c) => ({ ...c, g2: e.target.value as Gate }))}
            className="flex-1 rounded border border-border bg-surface px-2 py-1 uppercase"
          >
            {GATES.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-2 flex gap-2 text-xs">
        {(["A", "B", "C"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setCfg((c) => ({ ...c, [`not${v}`]: !c[`not${v}` as keyof Config] }))}
            className={cn(
              "rounded px-2 py-1 font-medium",
              cfg[`not${v}` as keyof Config] ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
            )}
          >
            NOT {v}
          </button>
        ))}
      </div>

      <p className="mt-3 rounded bg-surface px-3 py-2 text-center font-mono text-sm">OUT = {exprString(cfg)}</p>

      {/* truth table */}
      <table className="mt-3 w-full text-center font-mono text-xs">
        <thead className="text-faint">
          <tr>
            <th className="py-1">A</th>
            <th>B</th>
            <th>C</th>
            <th>OUT</th>
            {target ? <th className="text-accent">🎯</th> : null}
          </tr>
        </thead>
        <tbody>
          {column.map((o, i) => (
            <tr key={i} className={cn("border-t border-border", i === rowIndex && "bg-primary/10")}>
              <td className="py-0.5">{(i >> 2) & 1}</td>
              <td>{(i >> 1) & 1}</td>
              <td>{i & 1}</td>
              <td className={o ? "text-accent" : "text-muted"}>{o ? 1 : 0}</td>
              {target ? <td className={cn(target[i] ? "text-accent" : "text-muted")}>{target[i] ? 1 : 0}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={newTarget}>
          🎯 New target
        </Button>
        {target ? (
          <Button size="sm" onClick={check}>
            Check match
          </Button>
        ) : null}
        {result === "win" ? <span className="text-sm font-medium text-success">✓ Matches the target!</span> : null}
        {result === "miss" ? <span className="text-sm font-medium text-warn">Not yet — compare the columns.</span> : null}
      </div>
    </WidgetShell>
  );
}
