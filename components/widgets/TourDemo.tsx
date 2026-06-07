"use client";

import { useState } from "react";
import { cn } from "@/lib/util/cn";

const PLACES = [8, 4, 2, 1];

/** A tiny 4-bit toggle so the learner manipulates binary on day one. */
export function TourDemo() {
  const [bits, setBits] = useState<boolean[]>([false, false, false, false]);
  const value = bits.reduce((acc, b, i) => acc + (b ? PLACES[i] : 0), 0);
  const binary = bits.map((b) => (b ? "1" : "0")).join("");

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-end justify-center gap-3">
        {bits.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setBits((s) => s.map((x, j) => (j === i ? !x : x)))}
            className={cn(
              "flex h-16 w-14 flex-col items-center justify-center rounded-lg border transition-colors",
              b ? "border-primary bg-primary/15 text-text" : "border-border bg-surface text-muted",
            )}
            aria-pressed={b}
          >
            <span className="text-xs text-faint">{PLACES[i]}</span>
            <span className="font-mono text-2xl">{b ? 1 : 0}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <span className="font-mono text-sm text-muted">{binary}</span>
        <span className="mx-2 text-muted">=</span>
        <span className="text-2xl font-bold tabular-nums text-accent">{value}</span>
      </div>
    </div>
  );
}
