"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContentBlocks } from "@/components/content/ContentBlocks";
import { RecallChecklist } from "@/components/learn/RecallChecklist";
import { UnitGate } from "@/components/shell/UnitGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Unit } from "@/content/types";
import { getUnitProgress } from "@/lib/engine/gating";
import { useProgress } from "@/lib/progress/context";

function LearnView({ unit }: { unit: Unit }) {
  const sp = useSearchParams();
  const { progress, completeLesson } = useProgress();
  const up = getUnitProgress(progress, unit.id);

  const requested = sp.get("lesson");
  const lesson = unit.lessons.find((l) => l.id === requested) ?? unit.lessons[0];
  if (!lesson) return <p className="text-muted">No lessons here yet.</p>;

  const done = up.lessonsDone.includes(lesson.id);
  const idx = unit.lessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = unit.lessons[idx + 1];

  return (
    <div className="grid gap-5">
      <Link href={`/unit/${unit.id}`} className="text-sm text-muted hover:text-text">
        ← {unit.title}
      </Link>

      {unit.lessons.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {unit.lessons.map((l) => (
            <Link key={l.id} href={`/unit/${unit.id}/learn?lesson=${l.id}`}>
              <Badge tone={l.id === lesson.id ? "primary" : up.lessonsDone.includes(l.id) ? "success" : "muted"}>
                {up.lessonsDone.includes(l.id) ? "✓ " : ""}
                {l.title}
              </Badge>
            </Link>
          ))}
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-muted">{lesson.summary}</p>
      </div>

      <div className="grid gap-5">
        {lesson.cards.map((card) => (
          <Card key={card.id} className="p-5">
            <h2 className="mb-3 text-lg font-semibold">{card.title}</h2>
            <ContentBlocks blocks={card.blocks} />
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">Quick recall</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          Answer in your head, reveal, and rate yourself — then you can finish the lesson.
        </p>
        <RecallChecklist
          prompts={lesson.recall}
          completed={done}
          onComplete={() => completeLesson(unit.id, lesson.id)}
        />
      </Card>

      {done ? (
        <div className="flex justify-end">
          {nextLesson ? (
            <Link href={`/unit/${unit.id}/learn?lesson=${nextLesson.id}`}>
              <Button>Next lesson →</Button>
            </Link>
          ) : (
            <Link href={`/unit/${unit.id}/drill`}>
              <Button>Go drill →</Button>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

function LearnRoute() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitGate unitId={unitId}>{(unit) => <LearnView unit={unit} />}</UnitGate>;
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface" />}>
      <LearnRoute />
    </Suspense>
  );
}
