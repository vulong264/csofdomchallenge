"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Flashcard } from "@/content/types";
import { useProgress } from "@/lib/progress/context";
import type { ReviewGrade } from "@/lib/srs/sm2";

export function Flashcards({ unitId, cards }: { unitId: string; cards: Flashcard[] }) {
  const { reviewCard } = useProgress();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  if (cards.length === 0) return <p className="text-sm text-muted">No flashcards here yet.</p>;

  if (done) {
    return (
      <Card className="p-5 text-center">
        <p className="font-semibold">Cards reviewed — nice.</p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            setIndex(0);
            setFlipped(false);
            setDone(false);
          }}
        >
          Review again
        </Button>
      </Card>
    );
  }

  const card = cards[index];
  const grade = (g: ReviewGrade) => {
    reviewCard(card.id, unitId, g);
    if (index + 1 >= cards.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="muted">
          Card {index + 1} / {cards.length}
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
      ) : (
        <p className="mt-3 text-center text-xs text-muted">Reveal the answer, then rate how well you knew it.</p>
      )}
    </Card>
  );
}
