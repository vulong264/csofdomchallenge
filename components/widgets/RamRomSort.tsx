"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

type Kind = "RAM" | "ROM";
const ITEMS: { id: string; text: string; answer: Kind }[] = [
  { id: "vol", text: "Volatile — loses its contents when powered off", answer: "RAM" },
  { id: "nonvol", text: "Non-volatile — keeps contents without power", answer: "ROM" },
  { id: "rw", text: "Can be both read from and written to", answer: "RAM" },
  { id: "boot", text: "Holds the start-up (boot) instructions", answer: "ROM" },
  { id: "running", text: "Holds programs & data currently in use", answer: "RAM" },
  { id: "fixed", text: "Contents are fixed by the manufacturer", answer: "ROM" },
];

export function RamRomSort() {
  const [picks, setPicks] = useState<Record<string, Kind>>({});
  const [checked, setChecked] = useState(false);
  const allDone = ITEMS.every((i) => picks[i.id]);
  const score = ITEMS.filter((i) => picks[i.id] === i.answer).length;

  return (
    <WidgetShell>
      <div className="grid gap-2">
        {ITEMS.map((it) => {
          const pick = picks[it.id];
          const right = checked && pick === it.answer;
          const wrong = checked && pick && pick !== it.answer;
          return (
            <div
              key={it.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-surface px-3 py-2 text-sm",
                right ? "border-success/50" : wrong ? "border-danger/50" : "border-border",
              )}
            >
              <span className="flex-1">{it.text}</span>
              {(["RAM", "ROM"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setChecked(false);
                    setPicks((p) => ({ ...p, [it.id]: k }));
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    pick === k ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" disabled={!allDone} onClick={() => setChecked(true)}>
          Check
        </Button>
        {checked ? (
          <span className={cn("text-sm font-medium", score === ITEMS.length ? "text-success" : "text-warn")}>
            {score} / {ITEMS.length} correct
          </span>
        ) : null}
      </div>
    </WidgetShell>
  );
}
