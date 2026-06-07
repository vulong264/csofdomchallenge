"use client";

import { useState } from "react";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const PARTS: Record<string, string> = {
  CU: "Control Unit — decodes instructions and sends control signals to coordinate everything.",
  ALU: "Arithmetic Logic Unit — performs calculations and logic comparisons.",
  ACC: "Accumulator — a register that holds the result of ALU operations.",
  PC: "Program Counter — holds the address of the NEXT instruction to fetch.",
  MAR: "Memory Address Register — holds the address currently being read from or written to.",
  MDR: "Memory Data Register — holds the data/instruction just fetched from or about to go to memory.",
  CIR: "Current Instruction Register — holds the instruction currently being decoded/executed.",
  Memory: "Main memory (RAM) — stores instructions AND data together (the von Neumann idea).",
  Buses: "Address bus (where), Data bus (what), Control bus (signals) carry information between the CPU and memory.",
};

function PartBtn({ id, sel, onSelect }: { id: string; sel: string; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
        sel === id ? "border-primary bg-primary/15 text-text" : "border-border bg-surface text-muted hover:text-text",
      )}
    >
      {id}
    </button>
  );
}

export function VonNeumann() {
  const [sel, setSel] = useState<string>("CU");

  return (
    <WidgetShell>
      <div className="rounded-lg border border-border-strong bg-surface p-3">
        <div className="text-center text-[10px] uppercase tracking-wide text-faint">CPU</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-surface-2 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">Units</div>
            <div className="flex gap-1.5">
              <PartBtn id="CU" sel={sel} onSelect={setSel} />
              <PartBtn id="ALU" sel={sel} onSelect={setSel} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">Registers</div>
            <div className="flex flex-wrap gap-1.5">
              <PartBtn id="PC" sel={sel} onSelect={setSel} />
              <PartBtn id="MAR" sel={sel} onSelect={setSel} />
              <PartBtn id="MDR" sel={sel} onSelect={setSel} />
              <PartBtn id="CIR" sel={sel} onSelect={setSel} />
              <PartBtn id="ACC" sel={sel} onSelect={setSel} />
            </div>
          </div>
        </div>
      </div>

      <div className="my-2 flex justify-center">
        <button
          type="button"
          onClick={() => setSel("Buses")}
          className={cn(
            "rounded-md border px-3 py-1 text-xs",
            sel === "Buses" ? "border-primary bg-primary/15 text-text" : "border-border text-muted hover:text-text",
          )}
        >
          ↕ Address · Data · Control buses ↕
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setSel("Memory")}
          className={cn(
            "w-full rounded-lg border px-2 py-2 text-center text-xs font-medium",
            sel === "Memory" ? "border-primary bg-primary/15 text-text" : "border-border bg-surface text-muted hover:text-text",
          )}
        >
          Main Memory (RAM)
        </button>
      </div>

      <div className="mt-3 rounded-lg bg-surface-3 p-3 text-sm">
        <span className="font-semibold text-accent">{sel}</span> — {PARTS[sel]}
      </div>
      <p className="mt-2 text-center text-xs text-faint">Tap any part to learn its role.</p>
    </WidgetShell>
  );
}
