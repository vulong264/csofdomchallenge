"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AiError, gradeAnswer } from "@/lib/ai/client";
import type { Question } from "@/lib/domain/questions";
import { freeTextResult, gradeQuestion, type Answer, type GradeResult } from "@/lib/engine/grading";
import { useProgress } from "@/lib/progress/context";
import { Feedback } from "./Feedback";
import { QuestionInput } from "./QuestionInput";

function canSubmit(a: Answer | null): boolean {
  if (!a) return false;
  if (a.type === "numeric") return !Number.isNaN(a.value);
  if (a.type === "fill") return a.value.trim().length > 0;
  if (a.type === "freetext") return a.value.trim().length > 0;
  if (a.type === "multi") return a.choiceIds.length > 0;
  return true;
}

export function DrillRunner({ unitId, questions }: { unitId: string; questions: Question[] }) {
  const { recordDrill } = useProgress();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  if (questions.length === 0) return <p className="text-sm text-muted">No quick questions here yet.</p>;

  if (done) {
    return (
      <Card className="p-5 text-center">
        <p className="text-lg font-semibold">Drill complete</p>
        <p className="mt-1 text-sm text-muted">
          {correct} / {questions.length} correct
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            setIndex(0);
            setAnswer(null);
            setResult(null);
            setCorrect(0);
            setDone(false);
          }}
        >
          Run again
        </Button>
      </Card>
    );
  }

  const q = questions[index];

  const commit = (r: GradeResult) => {
    setResult(r);
    if (r.correct) setCorrect((c) => c + 1);
    recordDrill(unitId, r.correct);
  };

  const submit = async () => {
    if (!canSubmit(answer) || grading) return;
    setGradeError(null);

    // Free-text is graded by the AI examiner (async); everything else locally.
    if (q.type === "freetext" && answer?.type === "freetext") {
      setGrading(true);
      try {
        const grade = await gradeAnswer({
          mode: "exam",
          unitId,
          prompt: q.prompt,
          studentAnswer: answer.value,
          commandWord: q.commandWord,
          markPoints: q.markPoints,
          maxMarks: q.marks ?? q.markPoints.length,
          reference: q.modelAnswer,
        });
        commit(freeTextResult(grade));
      } catch (e) {
        // Graceful degrade: no key / network → self-mark against the scheme.
        const unavailable = e instanceof AiError && (e.reason === "unavailable" || e.reason === "network");
        setGradeError(
          unavailable
            ? "AI grading isn't available — compare your answer with the mark scheme below."
            : "Grading hit a snag — compare your answer with the mark scheme below.",
        );
      } finally {
        setGrading(false);
      }
      return;
    }

    commit(gradeQuestion(q, answer));
  };

  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setAnswer(null);
      setResult(null);
      setGradeError(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="muted">
          Question {index + 1} / {questions.length}
        </Badge>
        {q.commandWord ? <Badge tone="primary">{q.commandWord}</Badge> : null}
      </div>
      <p className="mb-4 font-medium">{q.prompt}</p>
      <QuestionInput
        question={q}
        answer={answer}
        onChange={setAnswer}
        disabled={!!result || grading}
        showCorrect={!!result}
      />
      {result ? (
        <div className="mt-4">
          <Feedback result={result} />
        </div>
      ) : null}
      {gradeError && q.type === "freetext" ? (
        <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">
          <p className="font-medium text-warn">{gradeError}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-faint">Mark scheme</p>
          <ul className="mt-1 grid list-disc gap-1 pl-5 text-text/80">
            {q.markPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Model answer: {q.modelAnswer}</p>
        </div>
      ) : null}
      <div className="mt-4 flex justify-end">
        {!result ? (
          <Button onClick={submit} disabled={!canSubmit(answer) || grading}>
            {grading ? "Marking…" : "Check"}
          </Button>
        ) : (
          <Button onClick={next}>{index + 1 >= questions.length ? "Finish" : "Next"}</Button>
        )}
      </div>
    </Card>
  );
}
