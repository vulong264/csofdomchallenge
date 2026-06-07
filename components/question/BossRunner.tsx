"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UNITS, getUnit, orderedUnits } from "@/content/index";
import type { Unit } from "@/content/types";
import type { AttemptOutcome } from "@/lib/engine/actions";
import { buildBossQuestions } from "@/lib/engine/interleave";
import { getUnitProgress } from "@/lib/engine/gating";
import { gradeTest, type Answer, type TestGrade } from "@/lib/engine/grading";
import { XP_REWARDS } from "@/lib/engine/xp";
import { useProgress } from "@/lib/progress/context";
import { QuestionInput } from "./QuestionInput";

type Phase = "intro" | "running" | "result";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function BossRunner({ unit }: { unit: Unit }) {
  const { progress, recordAttempt } = useProgress();
  const router = useRouter();
  const [questions] = useState(() => buildBossQuestions(unit, UNITS));

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer | null>>({});
  const [grade, setGrade] = useState<TestGrade | null>(null);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);

  const up = getUnitProgress(progress, unit.id);
  const flawlessOnLine = up.flawlessEligible && up.bestPercent < 80;

  const reset = () => {
    setPhase("intro");
    setIndex(0);
    setAnswers({});
    setGrade(null);
    setOutcome(null);
  };

  const submit = () => {
    const g = gradeTest(questions, answers);
    const o = recordAttempt(unit.id, {
      score: g.score,
      total: g.total,
      percent: g.percent,
      perTopic: g.perTopic,
      missedTopicCodes: g.missedTopicCodes,
    });
    setGrade(g);
    setOutcome(o);
    setPhase("result");
  };

  if (phase === "intro") {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-4xl" aria-hidden>
            👹
          </div>
          <h1 className="mt-2 text-2xl font-bold">{unit.sector.boss}</h1>
          <p className="mt-1 text-muted">
            Boss Fight · {unit.title}
          </p>
        </div>
        <div className="mt-5 grid gap-2 text-sm">
          <Row label="Questions" value={`${questions.length}`} />
          <Row label="Pass mark" value="80%" />
          <Row label="Your best so far" value={`${up.bestPercent}%`} />
          <Row label="Attempts" value={`${up.attemptsCount}`} />
        </div>
        {flawlessOnLine ? (
          <div className="mt-5 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
            <span className="font-semibold text-accent">⚡ Flawless is still on the line.</span> Bosses you enter
            unprepared cost you the Flawless bonus for this sector — forever. Make your first clear count.
          </div>
        ) : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/unit/${unit.id}`)}>
            Not yet
          </Button>
          <Button onClick={() => setPhase("running")}>Enter the boss</Button>
        </div>
      </Card>
    );
  }

  if (phase === "running") {
    const q = questions[index];
    const last = index === questions.length - 1;
    return (
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge tone="muted">
            Q{index + 1} / {questions.length}
          </Badge>
          {q.commandWord ? <Badge tone="primary">{q.commandWord}</Badge> : null}
        </div>
        <ProgressBar value={index} max={questions.length} className="mb-4" />
        <p className="mb-4 font-medium">{q.prompt}</p>
        <QuestionInput
          question={q}
          answer={answers[q.id] ?? null}
          onChange={(a) => setAnswers((s) => ({ ...s, [q.id]: a }))}
        />
        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Back
          </Button>
          {last ? (
            <Button onClick={submit}>Submit boss fight</Button>
          ) : (
            <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
          )}
        </div>
      </Card>
    );
  }

  // result
  if (!grade || !outcome) return null;
  const passed = outcome.passed;
  const xpGain =
    XP_REWARDS.bossAttempt + (passed ? XP_REWARDS.bossCleared : 0) + (outcome.flawless ? XP_REWARDS.flawless : 0);
  const seq = orderedUnits();
  const nextUnit = seq[seq.findIndex((u) => u.id === unit.id) + 1];
  const wrong = grade.results.filter((r) => !r.result.correct);

  return (
    <div className="grid gap-4">
      <Card className="p-6 text-center">
        <div className="text-5xl" aria-hidden>
          {passed ? (outcome.flawless ? "⭐" : "🏆") : "💀"}
        </div>
        <h1 className="mt-2 text-2xl font-bold">
          {passed ? (outcome.flawless ? "Flawless victory!" : "Sector cleared!") : "Defeated…"}
        </h1>
        <p className="mt-1 text-muted">
          {grade.score} / {grade.total} marks · {grade.percent}%
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <Badge tone="xp">+{xpGain} XP</Badge>
          {outcome.flawless ? <Badge tone="accent">⚡ Flawless trophy</Badge> : null}
          {passed && unit.isRewardSector ? <Badge tone="success">Mastery cash banked</Badge> : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {passed ? (
            <>
              {nextUnit ? (
                <Button onClick={() => router.push(`/unit/${nextUnit.id}`)}>Descend to {nextUnit.sector.name}</Button>
              ) : null}
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Dungeon
              </Button>
            </>
          ) : (
            <>
              <Button onClick={reset}>Retake boss</Button>
              <Button variant="outline" onClick={() => router.push(`/unit/${unit.id}`)}>
                Back to sector
              </Button>
            </>
          )}
        </div>
      </Card>

      {!passed && wrong.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">Targeted review</h2>
          <p className="mt-1 text-sm text-muted">Fix these, then retake. Each links back to the lesson that teaches it.</p>
          <ul className="mt-3 grid gap-3">
            {wrong.map(({ questionId, result }) => {
              const q = questions.find((x) => x.id === questionId);
              if (!q) return null;
              const lesson = getUnit(unit.id)?.lessons.find((l) => l.topicCode === q.topicCode);
              return (
                <li key={questionId} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                  <p className="font-medium">{q.prompt}</p>
                  <p className="mt-1 text-text/80">{result.feedback}</p>
                  {lesson ? (
                    <Link
                      href={`/unit/${unit.id}/learn?lesson=${lesson.id}`}
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Review: {lesson.title} →
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
