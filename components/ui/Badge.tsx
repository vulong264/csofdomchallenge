import type { ReactNode } from "react";
import { cn } from "@/lib/util/cn";

export type BadgeTone = "muted" | "primary" | "xp" | "success" | "accent" | "danger" | "warn";

const tones: Record<BadgeTone, string> = {
  muted: "bg-surface-3 text-muted",
  primary: "bg-primary/15 text-primary",
  xp: "bg-xp/15 text-xp",
  success: "bg-success/15 text-success",
  accent: "bg-accent/15 text-accent",
  danger: "bg-danger/15 text-danger",
  warn: "bg-warn/15 text-warn",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
