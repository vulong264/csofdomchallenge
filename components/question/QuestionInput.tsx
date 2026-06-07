"use client";

import type { Question } from "@/lib/domain/questions";
import type { Answer } from "@/lib/engine/grading";
import { cn } from "@/lib/util/cn";

interface Props {
  question: Question;
  answer: Answer | null;
  onChange: (a: Answer) => void;
  disabled?: boolean;
  /** After submitting (formative), colour the right/wrong choices. */
  showCorrect?: boolean;
}

const optionBase =
  "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default";

export function QuestionInput({ question, answer, onChange, disabled, showCorrect }: Props) {
  switch (question.type) {
    case "mcq":
      return (
        <div className="grid gap-2">
          {question.choices.map((c) => {
            const selected = answer?.type === "mcq" && answer.choiceId === c.id;
            const isCorrect = c.id === question.correctId;
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ type: "mcq", choiceId: c.id })}
                className={cn(
                  optionBase,
                  showCorrect && isCorrect && "border-success bg-success/10",
                  showCorrect && selected && !isCorrect && "border-danger bg-danger/10",
                  !showCorrect && selected ? "border-primary bg-primary/10" : "border-border hover:border-border-strong",
                )}
              >
                {c.text}
              </button>
            );
          })}
        </div>
      );

    case "multi": {
      const chosen = answer?.type === "multi" ? answer.choiceIds : [];
      return (
        <div className="grid gap-2">
          {question.choices.map((c) => {
            const selected = chosen.includes(c.id);
            const isCorrect = question.correctIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    type: "multi",
                    choiceIds: selected ? chosen.filter((x) => x !== c.id) : [...chosen, c.id],
                  })
                }
                className={cn(
                  optionBase,
                  "flex items-center gap-3",
                  showCorrect && isCorrect && "border-success bg-success/10",
                  showCorrect && selected && !isCorrect && "border-danger bg-danger/10",
                  !showCorrect && selected ? "border-primary bg-primary/10" : "border-border hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded border",
                    selected ? "border-primary bg-primary text-primary-fg" : "border-border-strong",
                  )}
                >
                  {selected ? "✓" : ""}
                </span>
                {c.text}
              </button>
            );
          })}
        </div>
      );
    }

    case "truefalse":
      return (
        <div className="flex gap-2">
          {[true, false].map((v) => {
            const selected = answer?.type === "truefalse" && answer.value === v;
            const isCorrect = v === question.answer;
            const label = v ? question.trueLabel ?? "True" : question.falseLabel ?? "False";
            return (
              <button
                key={String(v)}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ type: "truefalse", value: v })}
                className={cn(
                  optionBase,
                  "flex-1 text-center font-medium",
                  showCorrect && isCorrect && "border-success bg-success/10",
                  showCorrect && selected && !isCorrect && "border-danger bg-danger/10",
                  !showCorrect && selected ? "border-primary bg-primary/10" : "border-border hover:border-border-strong",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      );

    case "numeric": {
      const base = question.base ?? 10;
      const hint = base === 2 ? "binary" : base === 16 ? "hex" : "number";
      return (
        <div>
          <input
            inputMode={base === 10 ? "numeric" : "text"}
            disabled={disabled}
            autoComplete="off"
            placeholder={`Enter a ${hint}…`}
            className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 font-mono text-sm outline-none focus:border-primary"
            onChange={(e) => {
              const raw = e.target.value.trim().replace(/^0x/i, "").replace(/\s+/g, "");
              const value = raw === "" ? NaN : parseInt(raw, base);
              onChange({ type: "numeric", value });
            }}
          />
          {question.unit ? <span className="mt-1 block text-xs text-muted">Unit: {question.unit}</span> : null}
        </div>
      );
    }

    case "fill":
      return (
        <input
          disabled={disabled}
          autoComplete="off"
          placeholder="Type your answer…"
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 font-mono text-sm outline-none focus:border-primary"
          onChange={(e) => onChange({ type: "fill", value: e.target.value })}
        />
      );

    case "order": {
      const ids = answer?.type === "order" ? answer.order : question.items.map((i) => i.id);
      const labelFor = (id: string) => question.items.find((i) => i.id === id)?.text ?? id;
      const move = (idx: number, dir: -1 | 1) => {
        const next = [...ids];
        const j = idx + dir;
        if (j < 0 || j >= next.length) return;
        [next[idx], next[j]] = [next[j], next[idx]];
        onChange({ type: "order", order: next });
      };
      return (
        <ol className="grid gap-2">
          {ids.map((id, idx) => (
            <li key={id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="w-5 text-center text-xs text-faint">{idx + 1}</span>
              <span className="flex-1 text-sm">{labelFor(id)}</span>
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={disabled || idx === 0}
                  onClick={() => move(idx, -1)}
                  className="px-1 text-muted hover:text-text disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={disabled || idx === ids.length - 1}
                  onClick={() => move(idx, 1)}
                  className="px-1 text-muted hover:text-text disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            </li>
          ))}
        </ol>
      );
    }

    case "freetext": {
      const value = answer?.type === "freetext" ? answer.value : "";
      const marks = question.marks ?? question.markPoints.length;
      return (
        <div>
          <textarea
            disabled={disabled}
            value={value}
            rows={5}
            autoComplete="off"
            placeholder="Write your answer in full sentences…"
            className="w-full resize-y rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
            onChange={(e) => onChange({ type: "freetext", value: e.target.value })}
          />
          <span className="mt-1 block text-xs text-muted">
            Worth {marks} mark{marks === 1 ? "" : "s"} · graded by the AI examiner against the 0478 mark scheme.
          </span>
        </div>
      );
    }

    default:
      return (
        <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          This question type isn&apos;t interactive in this build yet.
        </p>
      );
  }
}
