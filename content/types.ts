/**
 * Typed curriculum content (spec §4). The content IS the source of truth — the
 * engine teaches to this, not to model recall. Units are drop-in extensible so
 * later syllabus topics slot in without refactoring.
 */
import type { Question } from "@/lib/domain/questions";

export type WidgetId =
  // Unit 1 — Data Representation
  | "base-converter"
  | "binary-adder"
  | "binary-shifter"
  | "twos-complement"
  | "pixel-builder"
  | "sound-sampler"
  // Unit 2 — Data Transmission
  | "packet-switch"
  | "parity-calc"
  | "check-digit"
  | "encryption-keys"
  // Unit 3 — Hardware
  | "fde-cycle"
  | "von-neumann-builder"
  | "sensor-match"
  | "ram-rom-sort"
  | "virtual-memory"
  // Unit 4 — Boolean Logic
  | "logic-playground"
  | "truth-table-fill"
  // Unit 5 — Algorithms
  | "flowchart-builder"
  | "pseudocode-runner"
  | "trace-table"
  | "sort-search-visualiser"
  | "classify-drill"
  // Tutorial sector
  | "tour-demo";

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "callout"; tone: "info" | "key" | "warn" | "mistake"; title?: string; text: string }
  | { kind: "code"; lang: "pseudocode" | "plain"; lines: string[]; caption?: string }
  | { kind: "kv"; rows: { k: string; v: string }[] }
  | { kind: "widget"; widget: WidgetId; caption?: string };

export interface ConceptCard {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

/** Active-recall checkpoint shown before a lesson can be marked "done" (§5.2). */
export interface RecallPrompt {
  id: string;
  prompt: string;
  answer: string; // revealed after the learner self-attempts
}

export interface Lesson {
  id: string;
  unitId: string;
  topicCode: string;
  title: string;
  summary: string;
  cards: ConceptCard[];
  widgets: WidgetId[];
  recall: RecallPrompt[];
}

export interface Flashcard {
  id: string;
  unitId: string;
  topicCode: string;
  front: string;
  back: string;
}

export interface MasteryTest {
  passThreshold: number; // 0.8
  /** Number of questions pulled from earlier units for interleaving (§5.4). */
  interleaveFromEarlier?: number;
  questions: Question[];
}

export interface Sector {
  number: number;
  name: string;
  boss: string;
}

/** Scopes the AI tutor to this unit and tells it which misconceptions to probe. */
export interface TutorContext {
  conceptSummary: string;
  misconceptions: string[];
}

export interface Unit {
  id: string;
  order: number;
  syllabusRef: string;
  paper: 1 | 2;
  title: string;
  blurb: string;
  sector: Sector;
  /** The 5 real units are reward-bearing; the tutorial sector is not. */
  isRewardSector: boolean;
  lessons: Lesson[];
  flashcards: Flashcard[];
  drill: Question[];
  masteryTest: MasteryTest;
  tutor: TutorContext;
}
