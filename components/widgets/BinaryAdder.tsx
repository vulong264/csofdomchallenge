"use client";

import { useState } from "react";
import { addUnsigned, denaryToBinary } from "@/lib/util/numberSystems";
import { cn } from "@/lib/util/cn";
import { LabeledInput, WidgetShell } from "./parts";

function Cell({ children, tone }: { children: string; tone?: string }) {
  return <div className={cn("py-0.5 text-center font-mono text-sm", tone)}>{children}</div>;
}

/** 8-bit adder showing per-column carries and an overflow flag that lights up. */
export function BinaryAdder() {
  const [a, setA] = useState(58);
  const [b, setB] = useState(72);
  const r = addUnsigned(a, b);
  const A = denaryToBinary(a).split("");
  const B = denaryToBinary(b).split("");
  const R = r.binary.split("");
  // Carry INTO each column, MSB-first, with the carry-out in the lead cell.
  const carryRow = [r.carryOut ? "1" : "", ...Array.from({ length: 8 }, (_, p) => (r.carries[7 - p] ? "1" : ""))];

  const clamp = (s: string) => {
    const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(n) ? 0 : Math.min(255, n);
  };

  return (
    <WidgetShell>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="A (0–255)" value={String(a)} onChange={(s) => setA(clamp(s))} />
        <LabeledInput label="B (0–255)" value={String(b)} onChange={(s) => setB(clamp(s))} />
      </div>

      <div className="mt-4 rounded-lg bg-surface p-3">
        <div className="grid grid-cols-9 gap-1">
          {carryRow.map((c, i) => (
            <Cell key={`c${i}`} tone="text-warn">
              {c}
            </Cell>
          ))}
          <Cell> </Cell>
          {A.map((d, i) => (
            <Cell key={`a${i}`}>{d}</Cell>
          ))}
          <Cell tone="text-muted">+</Cell>
          {B.map((d, i) => (
            <Cell key={`b${i}`}>{d}</Cell>
          ))}
          <div className="col-span-9 my-1 border-t border-border" />
          <Cell> </Cell>
          {R.map((d, i) => (
            <Cell key={`r${i}`} tone="text-accent">
              {d}
            </Cell>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          {a} + {b} = <span className="font-medium text-text tabular-nums">{r.sum}</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            r.overflow ? "bg-danger/20 text-danger" : "bg-success/15 text-success",
          )}
        >
          {r.overflow ? "⚠ OVERFLOW" : "No overflow"}
        </span>
      </div>
      {r.overflow ? (
        <p className="mt-2 text-xs text-danger">
          {r.sum} needs more than 8 bits, so the register wraps to {r.result}. An 8-bit register only holds 0–255.
        </p>
      ) : null}
    </WidgetShell>
  );
}
