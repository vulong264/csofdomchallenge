"use client";

import { useMemo, useState } from "react";
import { Feedback } from "@/components/question/Feedback";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AiError, gradeAnswer } from "@/lib/ai/client";
import type { Unit } from "@/content/types";
import { freeTextResult, type GradeResult } from "@/lib/engine/grading";

/**
 * "Explain it back" (build step 4): active recall. Tom explains a concept in his
 * own words and the AI gives formative, mark-scheme-style feedback — affirming
 * what's solid and naming any misconception. Graded in `explain` mode, so it's
 * encouraging, never gating.
 */
export function ExplainItBack({ unit, available }: { unit: Unit; available: boolean }) {
  // Topics to explain: each lesson, plus a whole-sector option.
  const topics = useMemo(
    () => [
      { id: "__all__", title: `All of ${unit.title}`, reference: unit.tutor.conceptSummary },
      ...unit.lessons.map((l) => ({ id: l.id, title: l.title, reference: l.summary })),
    ],
    [unit],
  );

  const [topicId, setTopicId] = useState(topics[0].id);
  const [text, setText] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topic = topics.find((t) => t.id === topicId) ?? topics[0];

  if (!available) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold">Explain it back</h2>
        <p className="mt-1 text-sm text-muted">
          This active-recall coach needs the AI grader, which isn&apos;t configured right now.
        </p>
      </Card>
    );
  }

  const submit = async () => {
    if (text.trim().length === 0 || grading) return;
    setError(null);
    setResult(null);
    setGrading(true);
    try {
      const grade = await gradeAnswer({
        mode: "explain",
        unitId: unit.id,
        prompt: `Explain in your own words: ${topic.title}`,
        studentAnswer: text,
        reference: topic.reference,
      });
      setResult(freeTextResult(grade));
    } catch (e) {
      setError(
        e instanceof AiError && e.reason === "unavailable"
          ? "The grader isn't configured right now."
          : "Couldn't grade that — try again.",
      );
    } finally {
      setGrading(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Explain it back</h2>
      <p className="mt-1 text-sm text-muted">
        Teach it back in your own words — the best test of real understanding. You&apos;ll get specific feedback, not a
        grade that counts against you.
      </p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-faint" htmlFor="eib-topic">
        Topic
      </label>
      <select
        id="eib-topic"
        value={topicId}
        disabled={grading}
        onChange={(e) => {
          setTopicId(e.target.value);
          setResult(null);
          setError(null);
        }}
        className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <textarea
        value={text}
        rows={5}
        disabled={grading}
        placeholder={`Explain "${topic.title}" as if teaching a friend…`}
        className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-primary"
        onChange={(e) => setText(e.target.value)}
      />

      {result ? (
        <div className="mt-3">
          <Feedback result={result} />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

      <div className="mt-3 flex justify-end gap-2">
        {result ? (
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setText("");
            }}
          >
            Try another
          </Button>
        ) : null}
        <Button onClick={submit} disabled={grading || text.trim().length === 0}>
          {grading ? "Marking…" : "Get feedback"}
        </Button>
      </div>
    </Card>
  );
}
