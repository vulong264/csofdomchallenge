"use client";

import { useState } from "react";
import { isbn13CheckDigit, isValidIsbn13 } from "@/lib/util/checkDigit";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

/** ISBN-13 check-digit validator — change a digit and watch it get caught. */
export function CheckDigit() {
  const [raw, setRaw] = useState("9780306406157");
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 13);
  const valid = digits.length === 13 && isValidIsbn13(digits);
  const expected = digits.length >= 12 ? isbn13CheckDigit(digits.slice(0, 12)) : null;

  return (
    <WidgetShell>
      <div className="flex flex-wrap justify-center gap-1">
        {Array.from({ length: 13 }, (_, i) => {
          const d = digits[i] ?? "";
          return (
            <div
              key={i}
              className={cn(
                "grid h-9 w-7 place-items-center rounded border font-mono text-sm",
                i === 12 ? "border-accent/60 bg-accent/10 text-accent" : "border-border bg-surface",
              )}
            >
              {d}
            </div>
          );
        })}
      </div>

      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-center font-mono text-sm outline-none focus:border-primary"
      />

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          Check digit should be{" "}
          <span className="font-mono text-text">{expected ?? "—"}</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            valid ? "bg-success/15 text-success" : "bg-danger/20 text-danger",
          )}
        >
          {digits.length === 13 ? (valid ? "✓ Valid ISBN" : "✗ Invalid") : `${digits.length}/13 digits`}
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        The last digit (gold) is the check digit. Change any digit above — the recalculated check digit no longer
        matches, so the error is detected.
      </p>
    </WidgetShell>
  );
}
