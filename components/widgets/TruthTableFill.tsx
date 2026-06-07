"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { outputColumn, type LogicExpr } from "@/lib/util/logic";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const v = (name: string): LogicExpr => ({ op: "var", name });
const PRESETS: { label: string; expr: LogicExpr }[] = [
  { label: "A AND (B OR C)", expr: { op: "and", a: v("A"), b: { op: "or", a: v("B"), b: v("C") } } },
  { label: "(A XOR B) OR (NOT C)", expr: { op: "or", a: { op: "xor", a: v("A"), b: v("B") }, b: { op: "not", a: v("C") } } },
  { label: "NOT (A AND B)", expr: { op: "not", a: { op: "and", a: v("A"), b: v("B") } } },
];
const VARS = ["A", "B", "C"];

export function TruthTableFill() {
  const [pi, setPi] = useState(0);
  const [fill, setFill] = useState<(0 | 1)[]>(() => Array(8).fill(0));
  const [checked, setChecked] = useState(false);

  const correct = outputColumn(PRESETS[pi].expr, VARS);
  const score = correct.filter((c, i) => (c ? 1 : 0) === fill[i]).length;

  const next = () => {
    setPi((p) => (p + 1) % PRESETS.length);
    setFill(Array(8).fill(0));
    setChecked(false);
  };
  const toggle = (i: number) => {
    setChecked(false);
    setFill((f) => f.map((x, j) => (j === i ? ((x ? 0 : 1) as 0 | 1) : x)));
  };

  return (
    <WidgetShell>
      <p className="text-center text-sm">
        Complete the output column for <span className="font-mono font-semibold text-accent">{PRESETS[pi].label}</span>
      </p>

      <table className="mx-auto mt-3 text-center font-mono text-sm">
        <thead className="text-faint text-xs">
          <tr>
            <th className="px-3 py-1">A</th>
            <th className="px-3">B</th>
            <th className="px-3">C</th>
            <th className="px-3">OUT</th>
          </tr>
        </thead>
        <tbody>
          {fill.map((o, i) => {
            const right = checked && (correct[i] ? 1 : 0) === o;
            const wrong = checked && (correct[i] ? 1 : 0) !== o;
            return (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-1 text-muted">{(i >> 2) & 1}</td>
                <td className="px-3 text-muted">{(i >> 1) & 1}</td>
                <td className="px-3 text-muted">{i & 1}</td>
                <td className="px-3">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className={cn(
                      "h-7 w-9 rounded border font-mono",
                      right && "border-success bg-success/15 text-success",
                      wrong && "border-danger bg-danger/15 text-danger",
                      !checked && "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    {o}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Button size="sm" onClick={() => setChecked(true)}>
          Check
        </Button>
        <Button size="sm" variant="ghost" onClick={next}>
          Next circuit
        </Button>
        {checked ? (
          <span className={cn("text-sm font-medium", score === 8 ? "text-success" : "text-warn")}>
            {score} / 8 rows
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-center text-xs text-faint">Tap a cell to toggle 0/1. Rows go 000 → 111 in order.</p>
    </WidgetShell>
  );
}
