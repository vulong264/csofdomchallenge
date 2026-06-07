"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const SENSORS = ["temperature", "moisture", "light", "pH", "pressure", "proximity", "infra-red", "gas", "humidity"];

const SCENARIOS = [
  { id: "greenhouse", text: "A greenhouse that keeps plants warm, well-lit and watered.", answer: ["temperature", "light", "moisture"] },
  { id: "carpark", text: "A barrier that detects a car waiting to enter a car park.", answer: ["infra-red", "proximity"] },
  { id: "pond", text: "A system monitoring the water quality of a fish pond.", answer: ["pH", "temperature"] },
];

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function SensorMatch() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const scenario = SCENARIOS[idx];
  const correct = sameSet(picked, scenario.answer);

  const toggle = (s: string) => {
    setChecked(false);
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };
  const next = () => {
    setIdx((i) => (i + 1) % SCENARIOS.length);
    setPicked([]);
    setChecked(false);
  };

  return (
    <WidgetShell>
      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-faint">Scenario {idx + 1}</span>
        <br />
        {scenario.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SENSORS.map((s) => {
          const on = picked.includes(s);
          const isAnswer = scenario.answer.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize",
                checked && isAnswer && "border-success bg-success/10 text-success",
                checked && on && !isAnswer && "border-danger bg-danger/10 text-danger",
                !checked && on ? "border-primary bg-primary/10 text-text" : "border-border text-muted hover:text-text",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" disabled={picked.length === 0} onClick={() => setChecked(true)}>
          Check
        </Button>
        <Button size="sm" variant="ghost" onClick={next}>
          Next scenario
        </Button>
        {checked ? (
          <span className={cn("text-sm font-medium", correct ? "text-success" : "text-warn")}>
            {correct ? "✓ Spot on" : "Not quite — green shows the right sensors"}
          </span>
        ) : null}
      </div>
    </WidgetShell>
  );
}
