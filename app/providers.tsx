"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { CosmeticToast } from "@/components/shell/CosmeticToast";
import { ThemeApplier } from "@/components/shell/ThemeApplier";
import { TimeTracker } from "@/components/shell/TimeTracker";
import { ProgressProvider, useProgress } from "@/lib/progress/context";

/** Bridges the learner's reduced-motion setting into Framer Motion. */
function MotionBridge({ children }: { children: ReactNode }) {
  const { progress } = useProgress();
  return (
    <MotionConfig reducedMotion={progress.settings.reducedMotion ? "always" : "user"}>{children}</MotionConfig>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider>
      <ThemeApplier />
      <TimeTracker />
      <MotionBridge>{children}</MotionBridge>
      <CosmeticToast />
    </ProgressProvider>
  );
}
