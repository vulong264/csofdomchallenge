"use client";

import { useState } from "react";
import { denaryToBinary, denaryToHex, placeValues } from "@/lib/util/numberSystems";
import { BitToggle, LabeledInput, WidgetShell } from "./parts";

const PLACES = placeValues(); // [128,64,…,1]

/** Live denary ⇄ binary ⇄ hex converter with a place-value visualiser. */
export function BaseConverter() {
  const [value, setValue] = useState(168);
  const bits = denaryToBinary(value).split("").map(Number);

  const toggle = (i: number) => {
    const next = bits.slice();
    next[i] = next[i] === 1 ? 0 : 1;
    setValue(parseInt(next.join(""), 2));
  };
  const onDenary = (s: string) => {
    const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    setValue(Number.isNaN(n) ? 0 : Math.min(255, n));
  };
  const onHex = (s: string) => {
    const clean = s.replace(/[^0-9a-fA-F]/g, "").slice(0, 2);
    const n = clean ? parseInt(clean, 16) : 0;
    setValue(Math.min(255, n));
  };

  const activeSum = PLACES.filter((_, i) => bits[i] === 1).join(" + ") || "0";

  return (
    <WidgetShell>
      <div className="flex justify-center gap-1.5">
        {bits.map((b, i) => (
          <BitToggle key={i} bit={b} place={PLACES[i]} onClick={() => toggle(i)} />
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        {activeSum} = <span className="font-bold tabular-nums text-accent">{value}</span>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <LabeledInput label="Denary" value={String(value)} onChange={onDenary} />
        <LabeledInput label="Binary" value={denaryToBinary(value)} readOnly />
        <LabeledInput label="Hex" value={denaryToHex(value)} onChange={onHex} />
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        Toggle the bits, or type a denary (0–255) or hex (00–FF) value — all three stay in sync.
      </p>
    </WidgetShell>
  );
}
