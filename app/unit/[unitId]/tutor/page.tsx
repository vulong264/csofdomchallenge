"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExplainItBack } from "@/components/tutor/ExplainItBack";
import { TutorChat } from "@/components/tutor/TutorChat";
import { UnitGate } from "@/components/shell/UnitGate";
import { fetchAiStatus } from "@/lib/ai/client";

export default function TutorPage() {
  const { unitId } = useParams<{ unitId: string }>();
  // null = still checking; true/false = AI configured or not.
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAiStatus(controller.signal).then(setAvailable);
    return () => controller.abort();
  }, []);

  return (
    <UnitGate unitId={unitId}>
      {(unit) => (
        <div className="grid gap-5">
          <Link href={`/unit/${unit.id}`} className="text-sm text-muted hover:text-text">
            ← {unit.title}
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tutor</h1>
            <p className="text-muted">Your Socratic AI guide for {unit.title}. Hints, not boss answers.</p>
          </div>

          {available === null ? (
            <div className="grid gap-3">
              <div className="h-[28rem] animate-pulse rounded-2xl bg-surface" />
            </div>
          ) : (
            <>
              <TutorChat unit={unit} available={available} />
              <ExplainItBack unit={unit} available={available} />
            </>
          )}
        </div>
      )}
    </UnitGate>
  );
}
