"use client";

import { useState } from "react";
import { checkParity, countOnes, parityBit, type Bit, type Parity } from "@/lib/util/parity";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const DATA: Bit[] = [1, 0, 1, 1, 0, 0, 1];

/** Parity calculator — flip a bit and watch the check fail. */
export function ParityCalc() {
  const [scheme, setScheme] = useState<Parity>("even");
  const [byte, setByte] = useState<Bit[]>(() => [...DATA, parityBit(DATA, "even")]);

  const ok = checkParity(byte, scheme);
  const ones = countOnes(byte);

  const toggle = (i: number) => setByte((b) => b.map((x, j) => (j === i ? ((x ? 0 : 1) as Bit) : x)));
  const changeScheme = (s: Parity) => {
    setScheme(s);
    setByte((b) => [...b.slice(0, 7), parityBit(b.slice(0, 7), s)]);
  };
  const fix = () => setByte((b) => [...b.slice(0, 7), parityBit(b.slice(0, 7), scheme)]);

  return (
    <WidgetShell>
      <div className="mb-3 flex items-center justify-center gap-2">
        {(["even", "odd"] as Parity[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => changeScheme(s)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium capitalize",
              s === scheme ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
            )}
          >
            {s} parity
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-1.5">
        {byte.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={cn(
              "flex w-9 flex-col items-center rounded-lg border py-2",
              i === 7 ? "border-accent/60" : "border-border",
              b === 1 ? "bg-primary/15 text-text" : "bg-surface text-muted",
            )}
          >
            <span className={cn("text-[9px]", i === 7 ? "text-accent" : "text-faint")}>
              {i === 7 ? "parity" : `d${i + 1}`}
            </span>
            <span className="font-mono text-lg">{b}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          Number of 1s: <span className="font-mono text-text">{ones}</span> ({ones % 2 === 0 ? "even" : "odd"})
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            ok ? "bg-success/15 text-success" : "bg-danger/20 text-danger",
          )}
        >
          {ok ? "✓ Parity OK" : "✗ Error detected"}
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        Flip any bit (like noise on the wire) and the count of 1s no longer matches the {scheme} scheme — the error is
        caught.{" "}
        <button type="button" onClick={fix} className="text-primary hover:underline">
          Reset parity
        </button>
      </p>
    </WidgetShell>
  );
}
