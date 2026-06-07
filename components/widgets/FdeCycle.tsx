"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

type Phase = "Fetch" | "Decode" | "Execute";
interface Step {
  phase: Phase;
  desc: string;
  active: string[];
  regs: { PC: string; MAR: string; MDR: string; CIR: string; ACC: string };
}

const MEMORY = [
  { addr: 0, val: "LDA 3" },
  { addr: 1, val: "ADD 4" },
  { addr: 2, val: "OUT" },
  { addr: 3, val: "12" },
  { addr: 4, val: "30" },
];

const STEPS: Step[] = [
  { phase: "Fetch", desc: "The address in the PC is copied to the MAR.", active: ["PC", "MAR", "addr"], regs: { PC: "0", MAR: "0", MDR: "–", CIR: "–", ACC: "0" } },
  { phase: "Fetch", desc: "The instruction at that address is fetched from memory into the MDR.", active: ["MDR", "data"], regs: { PC: "0", MAR: "0", MDR: "LDA 3", CIR: "–", ACC: "0" } },
  { phase: "Fetch", desc: "The instruction is copied from the MDR into the CIR.", active: ["MDR", "CIR"], regs: { PC: "0", MAR: "0", MDR: "LDA 3", CIR: "LDA 3", ACC: "0" } },
  { phase: "Fetch", desc: "The PC is incremented to point at the next instruction.", active: ["PC"], regs: { PC: "1", MAR: "0", MDR: "LDA 3", CIR: "LDA 3", ACC: "0" } },
  { phase: "Decode", desc: "The CU decodes the CIR: 'load the contents of address 3'.", active: ["CIR", "CU"], regs: { PC: "1", MAR: "0", MDR: "LDA 3", CIR: "LDA 3", ACC: "0" } },
  { phase: "Execute", desc: "The value at address 3 (12) is loaded into the ACC.", active: ["ACC", "ALU"], regs: { PC: "1", MAR: "3", MDR: "12", CIR: "LDA 3", ACC: "12" } },
  { phase: "Fetch", desc: "Next cycle: PC (1) is copied to the MAR.", active: ["PC", "MAR", "addr"], regs: { PC: "1", MAR: "1", MDR: "12", CIR: "LDA 3", ACC: "12" } },
  { phase: "Fetch", desc: "The instruction at address 1 is fetched into the MDR.", active: ["MDR", "data"], regs: { PC: "1", MAR: "1", MDR: "ADD 4", CIR: "LDA 3", ACC: "12" } },
  { phase: "Fetch", desc: "The instruction is copied to the CIR; the PC is incremented.", active: ["CIR", "PC"], regs: { PC: "2", MAR: "1", MDR: "ADD 4", CIR: "ADD 4", ACC: "12" } },
  { phase: "Decode", desc: "The CU decodes 'add the contents of address 4'.", active: ["CIR", "CU"], regs: { PC: "2", MAR: "1", MDR: "ADD 4", CIR: "ADD 4", ACC: "12" } },
  { phase: "Execute", desc: "The ALU adds the value at address 4 (30) to the ACC: 12 + 30 = 42.", active: ["ACC", "ALU"], regs: { PC: "2", MAR: "4", MDR: "30", CIR: "ADD 4", ACC: "42" } },
];

const phaseTone: Record<Phase, string> = {
  Fetch: "bg-xp/15 text-xp",
  Decode: "bg-warn/15 text-warn",
  Execute: "bg-success/15 text-success",
};

function Reg({ id, label, value, active }: { id: string; label: string; value: string; active: string[] }) {
  const on = active.includes(id);
  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5 text-center transition-colors",
        on ? "border-primary bg-primary/15" : "border-border bg-surface",
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

export function FdeCycle() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const a = step.active;

  return (
    <WidgetShell>
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", phaseTone[step.phase])}>
          {step.phase}
        </span>
        <span className="text-xs text-faint">
          Step {i + 1} / {STEPS.length}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">Main memory</div>
          <div className="grid gap-1">
            {MEMORY.map((m) => (
              <div
                key={m.addr}
                className={cn(
                  "flex items-center justify-between rounded border px-2 py-1 font-mono text-xs",
                  step.regs.MAR === String(m.addr) && a.includes("MAR")
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface",
                )}
              >
                <span className="text-faint">{m.addr}</span>
                <span>{m.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 content-start">
          <Reg id="PC" label="PC" value={step.regs.PC} active={a} />
          <Reg id="ACC" label="ACC" value={step.regs.ACC} active={a} />
          <Reg id="MAR" label="MAR" value={step.regs.MAR} active={a} />
          <Reg id="MDR" label="MDR" value={step.regs.MDR} active={a} />
          <Reg id="CIR" label="CIR" value={step.regs.CIR} active={a} />
          <div className="grid grid-cols-2 gap-1.5">
            <div className={cn("grid place-items-center rounded-lg border text-xs font-medium", a.includes("CU") ? "border-primary bg-primary/15" : "border-border bg-surface")}>CU</div>
            <div className={cn("grid place-items-center rounded-lg border text-xs font-medium", a.includes("ALU") ? "border-primary bg-primary/15" : "border-border bg-surface")}>ALU</div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5 text-[10px]">
        {[
          { id: "addr", label: "Address bus" },
          { id: "data", label: "Data bus" },
          { id: "control", label: "Control bus" },
        ].map((b) => (
          <span
            key={b.id}
            className={cn(
              "rounded px-1.5 py-0.5",
              a.includes(b.id) ? "bg-primary/20 text-primary" : "bg-surface-3 text-faint",
            )}
          >
            {b.label}
          </span>
        ))}
      </div>

      <p className="mt-3 min-h-10 text-sm text-text/90">{step.desc}</p>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setI((n) => n - 1)}>
          Back
        </Button>
        {i < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setI((n) => n + 1)}>
            Next step
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setI(0)}>
            Restart
          </Button>
        )}
      </div>
    </WidgetShell>
  );
}
