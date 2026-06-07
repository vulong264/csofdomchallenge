"use client";

import { useState } from "react";
import { signedPlaceValues, signedToTwosComplement } from "@/lib/util/numberSystems";
import { BitToggle, LabeledInput, WidgetShell } from "./parts";

const PLACES = signedPlaceValues(); // [-128,64,…,1]

/** Two's-complement explorer: the most-significant bit is the NEGATIVE sign bit. */
export function TwosComplement() {
  const [bits, setBits] = useState<number[]>(() => signedToTwosComplement(-75).split("").map(Number));
  const value = bits.reduce((acc, b, i) => acc + (b === 1 ? PLACES[i] : 0), 0);

  const toggle = (i: number) => setBits((s) => s.map((b, j) => (j === i ? (b === 1 ? 0 : 1) : b)));
  const onDenary = (s: string) => {
    const n = parseInt(s.replace(/[^0-9-]/g, ""), 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.max(-128, Math.min(127, n));
    setBits(signedToTwosComplement(clamped).split("").map(Number));
  };

  return (
    <WidgetShell>
      <div className="flex justify-center gap-1.5">
        {bits.map((b, i) => (
          <BitToggle key={i} bit={b} place={PLACES[i]} negative={i === 0} onClick={() => toggle(i)} />
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Signed value ={" "}
        <span className="font-bold tabular-nums text-accent">{value}</span>
      </p>
      <div className="mx-auto mt-4 max-w-40">
        <LabeledInput label="Denary (−128…127)" value={String(value)} onChange={onDenary} />
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        The left bit is worth <span className="text-danger">−128</span>. Set it and you&apos;re instantly negative —
        that&apos;s the sign bit.
      </p>
    </WidgetShell>
  );
}
