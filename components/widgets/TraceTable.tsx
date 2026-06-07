"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const CODE = `x ← 5
y ← 0
WHILE x > 0 DO
  y ← y + x
  x ← x - 1
ENDWHILE
OUTPUT y`;

// Authored expected trace.
const ROWS: { label: string; x: string; y: string; locked?: boolean }[] = [
  { label: "Start", x: "5", y: "0", locked: true },
  { label: "Iteration 1", x: "4", y: "5" },
  { label: "Iteration 2", x: "3", y: "9" },
  { label: "Iteration 3", x: "2", y: "12" },
  { label: "Iteration 4", x: "1", y: "14" },
  { label: "Iteration 5", x: "0", y: "15" },
];
const OUTPUT = "15";

export function TraceTable() {
  const [cells, setCells] = useState<Record<string, string>>({});
  const [out, setOut] = useState("");
  const [checked, setChecked] = useState(false);

  const get = (r: number, c: "x" | "y") => {
    const row = ROWS[r];
    if (row.locked) return row[c];
    return cells[`${r}-${c}`] ?? "";
  };
  const set = (r: number, c: "x" | "y", v: string) => {
    setChecked(false);
    setCells((s) => ({ ...s, [`${r}-${c}`]: v }));
  };
  const cellRight = (r: number, c: "x" | "y") => get(r, c).trim() === ROWS[r][c];

  return (
    <WidgetShell>
      <pre className="overflow-x-auto rounded-lg border border-border bg-[#0c0c15] p-3 font-mono text-xs leading-relaxed text-text/80">
        {CODE}
      </pre>
      <p className="mt-3 text-sm text-muted">Dry-run it: fill the value of each variable after every loop pass.</p>

      <table className="mt-2 w-full text-center text-sm">
        <thead className="text-xs text-faint">
          <tr>
            <th className="py-1 text-left">Step</th>
            <th>x</th>
            <th>y</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, r) => (
            <tr key={r} className="border-t border-border">
              <td className="py-1 text-left text-muted">{row.label}</td>
              {(["x", "y"] as const).map((c) => (
                <td key={c} className="py-1">
                  {row.locked ? (
                    <span className="font-mono text-faint">{row[c]}</span>
                  ) : (
                    <input
                      value={get(r, c)}
                      onChange={(e) => set(r, c, e.target.value)}
                      inputMode="numeric"
                      className={cn(
                        "h-7 w-12 rounded border bg-surface text-center font-mono outline-none focus:border-primary",
                        checked && (cellRight(r, c) ? "border-success" : "border-danger"),
                        !checked && "border-border",
                      )}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-border">
            <td className="py-1 text-left text-muted">OUTPUT</td>
            <td colSpan={2}>
              <input
                value={out}
                onChange={(e) => {
                  setChecked(false);
                  setOut(e.target.value);
                }}
                inputMode="numeric"
                className={cn(
                  "h-7 w-16 rounded border bg-surface text-center font-mono outline-none focus:border-primary",
                  checked && (out.trim() === OUTPUT ? "border-success" : "border-danger"),
                  !checked && "border-border",
                )}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3">
        <Button size="sm" onClick={() => setChecked(true)}>
          Check trace
        </Button>
      </div>
    </WidgetShell>
  );
}
