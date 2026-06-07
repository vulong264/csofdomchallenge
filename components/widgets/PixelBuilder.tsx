"use client";

import { useState } from "react";
import { coloursFromDepth, imageFileSize } from "@/lib/util/fileSize";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const DEPTHS = [1, 2, 4, 8];
const SIZES = [8, 16];

function makePalette(depth: number): string[] {
  if (depth === 1) return ["#0b0b12", "#f2f2f7"];
  const count = Math.min(coloursFromDepth(depth), 16);
  return Array.from({ length: count }, (_, i) => `hsl(${Math.round((i * 360) / count)} 70% 55%)`);
}

function Read({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-surface px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-faint">{k}</div>
      <div className="font-mono text-xs">{v}</div>
    </div>
  );
}

/** Build a pixel image — colour depth changes the palette AND the file size. */
export function PixelBuilder() {
  const [depth, setDepth] = useState(2);
  const [size, setSize] = useState(8);
  const [pixels, setPixels] = useState<number[]>(() => Array(8 * 8).fill(0));
  const [sel, setSel] = useState(1);

  const palette = makePalette(depth);
  const img = imageFileSize(size, size, depth);

  const resize = (s: number) => {
    setSize(s);
    setPixels(Array(s * s).fill(0));
  };
  const changeDepth = (d: number) => {
    setDepth(d);
    const len = makePalette(d).length;
    setSel((s) => Math.min(s, len - 1));
    setPixels((ps) => ps.map((p) => Math.min(p, len - 1)));
  };
  const paint = (i: number) => setPixels((ps) => ps.map((p, j) => (j === i ? sel : p)));

  return (
    <WidgetShell>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-faint">Colour depth</span>
          {DEPTHS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => changeDepth(d)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                d === depth ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
              )}
            >
              {d}-bit
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-faint">Grid</span>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => resize(s)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                s === size ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
              )}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-faint">
          Palette: {img.colours.toLocaleString()} colours
          {img.colours > palette.length ? ` (showing ${palette.length})` : ""}
        </span>
        {palette.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSel(i)}
            style={{ background: c }}
            className={cn("h-6 w-6 rounded border", i === sel ? "border-text ring-2 ring-primary" : "border-border")}
            aria-label={`colour ${i}`}
          />
        ))}
      </div>

      <div className="mt-3 flex justify-center">
        <div
          className="grid gap-px rounded-md bg-border p-px"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))`, width: size === 8 ? "16rem" : "20rem" }}
        >
          {pixels.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => paint(i)}
              style={{ background: palette[p] ?? palette[0], aspectRatio: "1" }}
              className="transition-opacity hover:opacity-80"
              aria-label={`pixel ${i}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <Read k="Resolution" v={`${size}×${size} = ${img.pixels} px`} />
        <Read k="Colour depth" v={`${depth} bits/px`} />
        <Read k="File size" v={`${img.bits.toLocaleString()} bits = ${img.human}`} />
      </div>
      <p className="mt-2 text-center text-xs text-faint">
        Resolution (pixels) × colour depth (bits) = total bits. More of either → a bigger file.
      </p>
    </WidgetShell>
  );
}
