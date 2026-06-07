"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { UNITS, getUnit } from "@/content/index";
import type { Unit } from "@/content/types";
import { computeUnitStatus } from "@/lib/engine/gating";
import { useProgress } from "@/lib/progress/context";

/**
 * Enforces mastery gating: a locked unit's content never renders, and the
 * learner is redirected to the dashboard. This is the client-side guard; true
 * server enforcement is the documented DB seam.
 */
export function UnitGate({ unitId, children }: { unitId: string; children: (unit: Unit) => ReactNode }) {
  const { progress, ready } = useProgress();
  const router = useRouter();
  const unit = getUnit(unitId);
  const status = unit ? computeUnitStatus(UNITS, progress, unit) : "locked";
  const blocked = !unit || status === "locked";

  useEffect(() => {
    if (ready && blocked) router.replace("/");
  }, [ready, blocked, router]);

  if (!ready) {
    return (
      <div className="grid gap-3">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  if (blocked || !unit) {
    return (
      <Card className="p-8 text-center">
        <div className="text-3xl" aria-hidden>
          🔒
        </div>
        <p className="mt-2 font-semibold">This sector is locked</p>
        <p className="mt-1 text-sm text-muted">Clear the previous boss to descend here.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to the Dungeon
        </Link>
      </Card>
    );
  }

  return <>{children(unit)}</>;
}
