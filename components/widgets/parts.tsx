"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/util/cn";

/** Shared bits for the interactive widgets. */

export function WidgetShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-surface-2 p-4", className)}>{children}</div>;
}

export function LabeledInput({
  label,
  value,
  onChange,
  readOnly,
  className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-faint">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-lg border border-border bg-surface px-3 py-2 text-center font-mono text-sm outline-none focus:border-primary",
          readOnly && "text-muted",
          className,
        )}
      />
    </label>
  );
}

/** A single bit toggle with a place-value label above it. */
export function BitToggle({
  bit,
  place,
  onClick,
  negative,
}: {
  bit: number;
  place: number | string;
  onClick?: () => void;
  negative?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={bit === 1}
      className={cn(
        "flex w-9 flex-col items-center rounded-lg border py-2 transition-colors disabled:cursor-default sm:w-10",
        bit === 1 ? "border-primary bg-primary/15 text-text" : "border-border bg-surface text-muted",
      )}
    >
      <span className={cn("text-[10px]", negative ? "text-danger" : "text-faint")}>{place}</span>
      <span className="font-mono text-xl">{bit}</span>
    </button>
  );
}
