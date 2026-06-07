"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { RecallPrompt } from "@/content/types";

/** Active-recall checkpoint: reveal + self-rate each prompt before finishing. */
export function RecallChecklist({
  prompts,
  completed,
  onComplete,
}: {
  prompts: RecallPrompt[];
  completed: boolean;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [rated, setRated] = useState<Record<string, boolean>>({});
  const allRated = prompts.every((p) => p.id in rated);

  return (
    <div className="grid gap-3">
      {prompts.map((p, i) => (
        <div key={p.id} className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium">
            {i + 1}. {p.prompt}
          </p>
          {revealed[p.id] ? (
            <>
              <p className="mt-2 text-sm text-success">{p.answer}</p>
              {p.id in rated ? (
                <p className="mt-2 text-xs text-faint">{rated[p.id] ? "✓ Got it" : "↻ Will review"}</p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRated((s) => ({ ...s, [p.id]: false }))}>
                    Need to review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRated((s) => ({ ...s, [p.id]: true }))}>
                    Got it
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setRevealed((s) => ({ ...s, [p.id]: true }))}>
              Reveal answer
            </Button>
          )}
        </div>
      ))}
      <Button disabled={completed || !allRated} onClick={onComplete}>
        {completed ? "Lesson complete ✓" : "Mark lesson complete"}
      </Button>
    </div>
  );
}
