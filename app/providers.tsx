"use client";

import type { ReactNode } from "react";
import { ProgressProvider } from "@/lib/progress/context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
