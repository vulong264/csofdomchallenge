"use client";

import { useState } from "react";
import { soundFileSize } from "@/lib/util/fileSize";
import { WidgetShell } from "./parts";

const W = 320;
const H = 130;
const P = 12;
const CYCLES = 2;

const xPx = (x: number) => P + x * (W - 2 * P);
const yPx = (amp: number) => P + (1 - (amp + 1) / 2) * (H - 2 * P);

/** Sound sampler: drag rate/resolution to see the reconstructed wave + file size. */
export function SoundSampler() {
  const [rate, setRate] = useState(12); // samples per second
  const [bits, setBits] = useState(3); // sample resolution
  const seconds = 1;
  const levels = 2 ** bits;

  // Original analogue signal.
  const sine = Array.from({ length: 121 }, (_, i) => {
    const x = i / 120;
    return `${i === 0 ? "M" : "L"} ${xPx(x).toFixed(1)} ${yPx(Math.sin(2 * Math.PI * CYCLES * x)).toFixed(1)}`;
  }).join(" ");

  // Sampled + quantised points.
  const samples = Array.from({ length: rate + 1 }, (_, k) => {
    const x = k / rate;
    const yTrue = Math.sin(2 * Math.PI * CYCLES * x);
    const idx = Math.max(0, Math.min(levels - 1, Math.round(((yTrue + 1) / 2) * (levels - 1))));
    return { x, q: (idx / (levels - 1)) * 2 - 1 };
  });

  // Sample-and-hold reconstruction (stepped).
  let recon = `M ${xPx(samples[0].x)} ${yPx(samples[0].q)}`;
  for (let k = 1; k < samples.length; k += 1) {
    recon += ` L ${xPx(samples[k].x)} ${yPx(samples[k - 1].q)} L ${xPx(samples[k].x)} ${yPx(samples[k].q)}`;
  }

  const size = soundFileSize(rate, bits, seconds);

  return (
    <WidgetShell>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-surface" role="img" aria-label="sound wave sampler">
        {levels <= 16
          ? Array.from({ length: levels }, (_, i) => {
              const y = yPx((i / (levels - 1)) * 2 - 1);
              return <line key={i} x1={P} x2={W - P} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.5} />;
            })
          : null}
        <path d={sine} fill="none" stroke="var(--muted)" strokeWidth={1.5} opacity={0.6} />
        <path d={recon} fill="none" stroke="var(--primary)" strokeWidth={2} />
        {samples.map((s, i) => (
          <circle key={i} cx={xPx(s.x)} cy={yPx(s.q)} r={2.5} fill="var(--accent)" />
        ))}
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-faint">
            <span>Sample rate</span>
            <span className="font-mono text-muted">{rate} samples/s</span>
          </span>
          <input
            type="range"
            min={4}
            max={40}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-faint">
            <span>Sample resolution</span>
            <span className="font-mono text-muted">
              {bits} bits → {levels} levels
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </label>
      </div>

      <div className="mt-3 rounded-md bg-surface px-3 py-2 text-center text-sm">
        <span className="text-muted">
          {rate} × {bits} × {seconds}s ={" "}
        </span>
        <span className="font-mono font-semibold text-accent">{size.bits.toLocaleString()} bits</span>
        <span className="text-muted"> ({size.human})</span>
      </div>
      <p className="mt-2 text-center text-xs text-faint">
        Higher rate (more dots) and higher resolution (finer steps) → a more accurate wave, but a bigger file. Real
        CD audio uses 44,100 samples/s at 16 bits.
      </p>
    </WidgetShell>
  );
}
