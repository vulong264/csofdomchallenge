"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { runPseudocode } from "@/lib/util/pseudocode";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const PRESETS = [
  {
    label: "Totalling",
    src: `total ← 0
FOR count ← 1 TO 5
  total ← total + count
NEXT count
OUTPUT "Total = ", total`,
  },
  {
    label: "Find maximum",
    src: `DECLARE Nums : ARRAY[1:4] OF INTEGER
Nums[1] ← 4
Nums[2] ← 9
Nums[3] ← 2
Nums[4] ← 7
max ← Nums[1]
FOR i ← 2 TO 4
  IF Nums[i] > max THEN
    max ← Nums[i]
  ENDIF
NEXT i
OUTPUT "Max = ", max`,
  },
  {
    label: "Linear search",
    src: `DECLARE List : ARRAY[1:5] OF INTEGER
List[1] ← 3
List[2] ← 8
List[3] ← 5
List[4] ← 2
List[5] ← 9
target ← 5
found ← FALSE
i ← 1
WHILE i <= 5 AND found = FALSE DO
  IF List[i] = target THEN
    found ← TRUE
  ELSE
    i ← i + 1
  ENDIF
ENDWHILE
OUTPUT "Found at position ", i`,
  },
];

export function PseudocodeRunner() {
  const [pi, setPi] = useState(0);
  const [step, setStep] = useState(0);
  const preset = PRESETS[pi];
  const result = useMemo(() => runPseudocode(preset.src), [preset]);
  const lines = preset.src.split("\n");
  const cur = result.trace[step];
  const activeLine = cur?.line ?? -1;

  const select = (i: number) => {
    setPi(i);
    setStep(0);
  };

  return (
    <WidgetShell>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => select(i)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              i === pi ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <pre className="overflow-x-auto rounded-lg border border-border bg-[#0c0c15] p-3 text-xs leading-relaxed">
          {lines.map((ln, i) => (
            <div
              key={i}
              className={cn(
                "-mx-1 rounded px-1 font-mono",
                i + 1 === activeLine ? "bg-primary/25 text-text" : "text-text/80",
              )}
            >
              <span className="mr-2 select-none text-faint">{String(i + 1).padStart(2, " ")}</span>
              {ln || " "}
            </div>
          ))}
        </pre>

        <div className="grid content-start gap-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">Variables</div>
            <div className="flex flex-wrap gap-1.5">
              {cur && Object.keys(cur.vars).length > 0 ? (
                Object.entries(cur.vars).map(([k, v]) => (
                  <span key={k} className="rounded bg-surface-3 px-2 py-1 font-mono text-xs">
                    {k} = <span className="text-accent">{v}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-faint">none yet</span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">Output</div>
            <div className="min-h-8 rounded bg-surface px-2 py-1 font-mono text-xs text-success">
              {cur?.output.join("\n") || "—"}
            </div>
          </div>
        </div>
      </div>

      {result.error ? <p className="mt-2 text-xs text-danger">Error: {result.error}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={step >= result.trace.length - 1} onClick={() => setStep((s) => s + 1)}>
          Next step
        </Button>
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Restart
        </Button>
        <span className="text-xs text-faint">
          Step {Math.min(step + 1, result.trace.length)} / {result.trace.length}
        </span>
      </div>
    </WidgetShell>
  );
}
