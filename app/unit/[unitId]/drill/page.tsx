"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Flashcards } from "@/components/drill/Flashcards";
import { DrillRunner } from "@/components/question/DrillRunner";
import { UnitGate } from "@/components/shell/UnitGate";
import { Button } from "@/components/ui/Button";
import type { Unit } from "@/content/types";

function DrillView({ unit }: { unit: Unit }) {
  const [tab, setTab] = useState<"cards" | "quiz">("cards");
  return (
    <div className="grid gap-5">
      <Link href={`/unit/${unit.id}`} className="text-sm text-muted hover:text-text">
        ← {unit.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Drill</h1>
        <p className="text-muted">Low-stakes practice with instant feedback — no score pressure.</p>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "cards" ? "primary" : "outline"} size="sm" onClick={() => setTab("cards")}>
          Flashcards ({unit.flashcards.length})
        </Button>
        <Button variant={tab === "quiz" ? "primary" : "outline"} size="sm" onClick={() => setTab("quiz")}>
          Quick questions ({unit.drill.length})
        </Button>
      </div>
      {tab === "cards" ? (
        <Flashcards unitId={unit.id} cards={unit.flashcards} />
      ) : (
        <DrillRunner unitId={unit.id} questions={unit.drill} />
      )}
    </div>
  );
}

export default function DrillPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitGate unitId={unitId}>{(unit) => <DrillView unit={unit} />}</UnitGate>;
}
