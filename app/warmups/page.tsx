"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UNITS } from "@/content/index";
import type { Flashcard } from "@/content/types";
import { useProgress } from "@/lib/progress/context";
import { dueReviews, type ReviewGrade } from "@/lib/srs/sm2";

const CARD_BY_ID: Record<string, Flashcard> = Object.fromEntries(
  UNITS.flatMap((u) => u.flashcards.map((f) => [f.id, f] as const)),
);

export default function WarmUpsPage() {
  const { progress, ready, today, reviewCard } = useProgress();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Snapshot the due queue once (guarded setState during render — a React-
  // sanctioned pattern) so grading, which pushes due dates forward, doesn't
  // reshuffle the queue mid-session.
  const [queue, setQueue] = useState<string[] | null>(null);
  if (ready && queue === null) {
    setQueue(dueReviews(progress.reviews, today).map((r) => r.cardId).filter((id) => CARD_BY_ID[id]));
  }

  if (!ready || queue === null) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  if (queue.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-3xl" aria-hidden>
          ✅
        </div>
        <p className="mt-2 font-semibold">No warm-ups due</p>
        <p className="mt-1 text-sm text-muted">Patrols from cleared sectors appear here when they&apos;re due.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to the Dungeon
        </Link>
      </Card>
    );
  }

  if (index >= queue.length) {
    return (
      <Card className="p-8 text-center">
        <div className="text-3xl" aria-hidden>
          🛡️
        </div>
        <p className="mt-2 font-semibold">Patrols cleared — Rank held.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to the Dungeon
        </Link>
      </Card>
    );
  }

  const card = CARD_BY_ID[queue[index]];
  const grade = (g: ReviewGrade) => {
    reviewCard(card.id, card.unitId, g);
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  return (
    <div className="grid gap-5">
      <Link href="/" className="text-sm text-muted hover:text-text">
        ← Dungeon
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Warm-ups</h1>
        <p className="text-muted">Quick patrols to keep earlier sectors sharp.</p>
      </div>
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge tone="muted">
            Card {index + 1} / {queue.length}
          </Badge>
          <Badge tone="xp">Spaced repetition</Badge>
        </div>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-border bg-surface-2 p-6 text-center"
        >
          <span className="text-xs uppercase tracking-wide text-faint">{flipped ? "Answer" : "Question"}</span>
          <span className="mt-2 text-lg font-medium">{flipped ? card.back : card.front}</span>
          {!flipped ? <span className="mt-3 text-xs text-muted">Tap to reveal</span> : null}
        </button>
        {flipped ? (
          <div className="mt-4 grid grid-cols-4 gap-2">
            <Button variant="danger" onClick={() => grade("again")}>
              Again
            </Button>
            <Button variant="outline" onClick={() => grade("hard")}>
              Hard
            </Button>
            <Button variant="outline" onClick={() => grade("good")}>
              Good
            </Button>
            <Button variant="accent" onClick={() => grade("easy")}>
              Easy
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
