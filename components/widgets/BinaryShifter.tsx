"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { denaryToBinary, logicalShift, type ShiftResult } from "@/lib/util/numberSystems";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const START = 43;

/** Logical shift animator: left = ×2, right = ÷2; bits off the end are lost. */
export function BinaryShifter() {
  const [value, setValue] = useState(START);
  const [last, setLast] = useState<ShiftResult | null>(null);
  const bits = denaryToBinary(value).split("");

  const doShift = (dir: "left" | "right") => {
    const r = logicalShift(value, dir, 1);
    setValue(r.valueAfter);
    setLast(r);
  };

  return (
    <WidgetShell>
      <div className="flex justify-center gap-1.5">
        {bits.map((d, i) => (
          <div
            key={i}
            className={cn(
              "flex h-12 w-9 items-center justify-center rounded-lg border font-mono text-xl",
              d === "1" ? "border-primary bg-primary/15" : "border-border bg-surface text-muted",
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm">
        Value: <span className="font-bold tabular-nums text-accent">{value}</span>
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => doShift("left")}>
          ⟵ Shift left (×2)
        </Button>
        <Button variant="outline" size="sm" onClick={() => doShift("right")}>
          Shift right (÷2) ⟶
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue(START);
            setLast(null);
          }}
        >
          Reset
        </Button>
      </div>
      {last ? (
        <p className="mt-3 text-center text-xs text-muted">
          Shifted {last.direction}: {last.valueBefore} → <span className="text-text">{last.valueAfter}</span>{" "}
          {last.direction === "left"
            ? last.lostBits === "1"
              ? "— a 1 fell off the end (overflow), so it's not exactly ×2."
              : "— exactly ×2."
            : last.lostBits === "1"
              ? "— a 1 fell off, so the remainder is lost (÷2 rounded down)."
              : "— exactly ÷2."}
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-faint">
          Left multiplies by 2, right divides by 2. Bits pushed off the end are lost; zeros fill in.
        </p>
      )}
    </WidgetShell>
  );
}
