/**
 * The question model — one discriminated union the engine grades by `type`.
 * MCQ distractors carry an optional `misconception` so a wrong click diagnoses
 * a specific gap (spec §5.11). Free-text/circuit/trace are graded specially.
 */
import type { CommandWord } from "./command-words";

export type Difficulty = "intro" | "core" | "stretch";

export interface QuestionBase {
  id: string;
  unitId: string;
  topicCode: string; // e.g. "1.1"
  prompt: string;
  explanation: string; // shown after answering
  commandWord?: CommandWord;
  difficulty: Difficulty;
  marks?: number; // defaults to 1
}

export interface Choice {
  id: string;
  text: string;
  /** Why a learner might wrongly pick this — used as a diagnostic on a wrong answer. */
  misconception?: string;
}

export type Question =
  | (QuestionBase & { type: "mcq"; choices: Choice[]; correctId: string })
  | (QuestionBase & { type: "multi"; choices: Choice[]; correctIds: string[] })
  | (QuestionBase & {
      type: "truefalse";
      answer: boolean;
      trueLabel?: string;
      falseLabel?: string;
    })
  | (QuestionBase & {
      type: "numeric";
      answer: number;
      base?: 2 | 10 | 16; // how the learner enters it (binary/hex/denary)
      unit?: string;
      tolerance?: number;
    })
  | (QuestionBase & {
      type: "fill";
      answer: string;
      accept?: string[]; // additional accepted answers
      caseSensitive?: boolean;
    })
  | (QuestionBase & { type: "order"; items: Choice[]; correctOrder: string[] })
  | (QuestionBase & {
      type: "match";
      left: Choice[];
      right: Choice[];
      correct: Record<string, string>; // left.id -> right.id
    })
  | (QuestionBase & {
      type: "circuit";
      variables: string[]; // ≤3
      targetOutputs: boolean[]; // truth-table output column, standard order
    })
  | (QuestionBase & {
      type: "trace";
      columns: string[];
      algorithm: string[]; // pseudocode lines shown to the learner
      expectedRows: (string | number)[][];
    })
  | (QuestionBase & {
      type: "freetext";
      markPoints: string[]; // the mark scheme
      modelAnswer: string;
      minMarkPoints?: number; // marks needed to count "correct" in a test
    });

export type QuestionType = Question["type"];

export const questionMarks = (q: Question): number => q.marks ?? 1;
