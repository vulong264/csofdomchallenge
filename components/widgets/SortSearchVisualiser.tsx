"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { bubbleSortSteps, linearSearchSteps } from "@/lib/util/algorithms";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const DATA = [5, 2, 8, 1, 9, 3];
const MAX = Math.max(...DATA);
type Mode = "bubble" | "search";

export function SortSearchVisualiser() {
  const [mode, setMode] = useState<Mode>("bubble");
  const [target, setTarget] = useState(8);
  const [step, setStep] = useState(0);

  const bubble = useMemo(() => bubbleSortSteps(DATA), []);
  const search = useMemo(() => linearSearchSteps(DATA, target), [target]);

  const total = mode === "bubble" ? bubble.steps.length : search.steps.length;
  const s = Math.min(step, total - 1);

  const array = mode === "bubble" ? bubble.steps[s]?.array ?? DATA : DATA;
  const compared = mode === "bubble" ? bubble.steps[s]?.compared : undefined;
  const searchIdx = mode === "search" ? search.steps[s]?.index : undefined;
  const searchMatch = mode === "search" ? search.steps[s]?.match : false;

  const reset = (m: Mode) => {
    setMode(m);
    setStep(0);
  };

  return (
    <WidgetShell>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => reset("bubble")}
          className={cn("rounded-md px-2.5 py-1 text-xs font-medium", mode === "bubble" ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text")}
        >
          Bubble sort
        </button>
        <button
          type="button"
          onClick={() => reset("search")}
          className={cn("rounded-md px-2.5 py-1 text-xs font-medium", mode === "search" ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text")}
        >
          Linear search
        </button>
        {mode === "search" ? (
          <label className="ml-2 flex items-center gap-1.5 text-xs text-faint">
            target
            <select
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                setStep(0);
              }}
              className="rounded border border-border bg-surface px-2 py-1"
            >
              {[...DATA, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-end justify-center gap-2" style={{ height: 120 }}>
        {array.map((v, i) => {
          const isCompared = compared?.includes(i);
          const isSearch = searchIdx === i;
          const found = isSearch && searchMatch;
          return (
            <div key={i} className="flex flex-col items-center justify-end">
              <div
                className={cn(
                  "w-8 rounded-t transition-all",
                  found ? "bg-success" : isCompared || isSearch ? "bg-accent" : "bg-primary/60",
                )}
                style={{ height: `${(v / MAX) * 96 + 12}px` }}
              />
              <span className="mt-1 font-mono text-xs text-muted">{v}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 min-h-8 text-center text-sm text-text/90">
        {mode === "bubble"
          ? bubble.steps[s]
            ? `Pass ${bubble.steps[s].pass + 1}: comparing positions ${bubble.steps[s].compared[0] + 1} & ${bubble.steps[s].compared[1] + 1} — ${bubble.steps[s].swapped ? "swapped" : "no swap"}.`
            : "Sorted."
          : search.steps[s]
            ? search.steps[s].match
              ? `Found ${target} at position ${search.steps[s].index + 1}.`
              : `Checking position ${search.steps[s].index + 1} (${search.steps[s].value}) — not ${target}.`
            : `${target} not in the list.`}
      </p>

      <div className="mt-2 flex items-center justify-center gap-2">
        <Button size="sm" variant="ghost" disabled={s === 0} onClick={() => setStep((n) => n - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={s >= total - 1} onClick={() => setStep((n) => n + 1)}>
          Next
        </Button>
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Restart
        </Button>
        <span className="text-xs text-faint">
          {Math.min(s + 1, total)} / {total}
        </span>
      </div>
    </WidgetShell>
  );
}
