"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/shell/StatusBadge";
import { UnitGate } from "@/components/shell/UnitGate";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UNITS } from "@/content/index";
import type { Unit } from "@/content/types";
import { computeUnitStatus, getUnitProgress } from "@/lib/engine/gating";
import { useProgress } from "@/lib/progress/context";

const ROOMS = [
  { slug: "learn", title: "Learn", desc: "Concept cards + interactive widgets", icon: "📖" },
  { slug: "drill", title: "Drill", desc: "Flashcards + quick questions", icon: "🎯" },
  { slug: "tutor", title: "Tutor", desc: "Ask the AI guide for hints", icon: "🧠" },
  { slug: "test", title: "Boss Fight", desc: "The scored test — pass at 80%", icon: "⚔️" },
] as const;

function UnitOverview({ unit }: { unit: Unit }) {
  const { progress } = useProgress();
  const up = getUnitProgress(progress, unit.id);
  const status = computeUnitStatus(UNITS, progress, unit);
  const lessonsDone = unit.lessons.filter((l) => up.lessonsDone.includes(l.id)).length;

  return (
    <div className="grid gap-5">
      <Link href="/" className="text-sm text-muted hover:text-text">
        ← Dungeon
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{unit.title}</h1>
          <StatusBadge status={status} />
          {up.flawlessAchieved ? <Badge tone="accent">⭐ Flawless</Badge> : null}
        </div>
        <p className="mt-1 text-muted">
          Sector {unit.sector.number} · Boss: {unit.sector.boss} · {unit.syllabusRef}
        </p>
        <p className="mt-2 text-sm text-text/80">{unit.blurb}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROOMS.map((r) => (
          <Link key={r.slug} href={`/unit/${unit.id}/${r.slug}`} className="block">
            <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:border-border-strong">
              <div className="text-2xl" aria-hidden>
                {r.icon}
              </div>
              <div>
                <div className="font-semibold">{r.title}</div>
                <p className="text-xs text-muted">{r.desc}</p>
                {r.slug === "learn" ? (
                  <p className="mt-1 text-xs text-faint">
                    {lessonsDone}/{unit.lessons.length} lessons done
                  </p>
                ) : null}
                {r.slug === "test" ? (
                  <p className="mt-1 text-xs text-faint">
                    Best {up.bestPercent}% · {up.attemptsCount} attempt{up.attemptsCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitGate unitId={unitId}>{(unit) => <UnitOverview unit={unit} />}</UnitGate>;
}
