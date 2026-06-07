"use client";

import { useParams } from "next/navigation";
import { BossRunner } from "@/components/question/BossRunner";
import { UnitGate } from "@/components/shell/UnitGate";

export default function TestPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitGate unitId={unitId}>{(unit) => <BossRunner unit={unit} />}</UnitGate>;
}
