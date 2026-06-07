"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

type Mode = "vv" | "td";
interface Item {
  text: string;
  answer: string;
  why: string;
}

const VV: Item[] = [
  { text: "Checking a value is between 1 and 100", answer: "Validation", why: "a range check — the program checks the input is sensible." },
  { text: "Typing a password twice to check the two match", answer: "Verification", why: "a double-entry check — confirms it was entered accurately." },
  { text: "Checking a required field is not left empty", answer: "Validation", why: "a presence check." },
  { text: "Proofreading typed data against the paper original", answer: "Verification", why: "a visual check for accurate copying." },
  { text: "Checking an email address contains an @", answer: "Validation", why: "a format check." },
  { text: "Checking the input is a whole number", answer: "Validation", why: "a type check." },
];
const TD: Item[] = [
  { text: "A mark of 57 in a 0–100 test", answer: "Normal", why: "a typical value inside the accepted range." },
  { text: "Entering 100 — the highest allowed mark", answer: "Extreme", why: "the largest acceptable value." },
  { text: "Entering 150 in a 0–100 test", answer: "Abnormal", why: "outside the range — it should be rejected." },
  { text: "Testing 100 and 101 together at the top of 0–100", answer: "Boundary", why: "largest accepted value AND smallest rejected value." },
  { text: "Entering −5 where only 0+ is allowed", answer: "Abnormal", why: "a rejected value." },
  { text: "Testing 0 and −1 at the bottom of the range", answer: "Boundary", why: "smallest accepted value and its rejected neighbour." },
];

const OPTIONS: Record<Mode, string[]> = {
  vv: ["Validation", "Verification"],
  td: ["Normal", "Abnormal", "Extreme", "Boundary"],
};

export function ClassifyDrill() {
  const [mode, setMode] = useState<Mode>("vv");
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const items = mode === "vv" ? VV : TD;
  const item = items[idx];
  const correct = pick === item.answer;

  const choose = (opt: string) => {
    if (pick) return;
    setPick(opt);
    setScore((s) => ({ right: s.right + (opt === item.answer ? 1 : 0), total: s.total + 1 }));
  };
  const next = () => {
    setIdx((i) => (i + 1) % items.length);
    setPick(null);
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setIdx(0);
    setPick(null);
    setScore({ right: 0, total: 0 });
  };

  return (
    <WidgetShell>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button type="button" onClick={() => switchMode("vv")} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", mode === "vv" ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text")}>
            Validation / Verification
          </button>
          <button type="button" onClick={() => switchMode("td")} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", mode === "td" ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text")}>
            Test data
          </button>
        </div>
        <span className="text-xs text-faint">
          {score.right}/{score.total}
        </span>
      </div>

      <p className="rounded-lg border border-border bg-surface px-3 py-3 text-sm">{item.text}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS[mode].map((opt) => {
          const isAnswer = opt === item.answer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium",
                pick && isAnswer && "border-success bg-success/10 text-success",
                pick === opt && !isAnswer && "border-danger bg-danger/10 text-danger",
                !pick && "border-border text-muted hover:border-border-strong hover:text-text",
                pick && !isAnswer && pick !== opt && "border-border text-faint",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {pick ? (
        <div className="mt-3 text-sm">
          <span className={cn("font-medium", correct ? "text-success" : "text-danger")}>
            {correct ? "✓ Correct" : `✗ It's ${item.answer}`}
          </span>{" "}
          <span className="text-muted">— {item.why}</span>
          <div className="mt-2">
            <Button size="sm" onClick={next}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}
