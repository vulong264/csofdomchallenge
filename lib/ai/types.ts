/**
 * Shared request/response contracts for the AI tutor + free-text grading
 * (build step 4). These are PURE types — no SDK or server imports — so both the
 * server routes (`app/api/*`) and the client components can depend on them
 * without dragging the Gemini key anywhere near the browser bundle.
 */
import type { CommandWord } from "@/lib/domain/command-words";

/** One turn in a tutor conversation. The system prompt is server-built. */
export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

/** POST body for `/api/tutor`. The server scopes the model to `unitId`. */
export interface TutorRequest {
  unitId: string;
  messages: TutorMessage[];
}

/**
 * POST body for `/api/grade` — grades a free-text answer two ways:
 *  - `mode: "exam"` → strict Cambridge 0478 mark-scheme grading against
 *    `markPoints` (the awardable points) for a `freetext` Question.
 *  - `mode: "explain"` → formative "explain it back" feedback against a
 *    concept summary; lenient, encouraging, still names misconceptions.
 */
export interface GradeRequest {
  mode: "exam" | "explain";
  unitId: string;
  /** The question / task the learner was answering. */
  prompt: string;
  /** The learner's free-text response. */
  studentAnswer: string;
  commandWord?: CommandWord;
  /** Exam mode: the mark scheme (one awardable point per entry). */
  markPoints?: string[];
  /** Exam mode: total marks available (defaults to markPoints.length). */
  maxMarks?: number;
  /** A model answer (exam) or concept summary (explain) to grade against. */
  reference?: string;
}

/** Structured grade returned by `/api/grade` and rendered as feedback. */
export interface GradeResponse {
  marksAwarded: number;
  maxMarks: number;
  /** True once the learner has met the bar (exam: per mark scheme). */
  correct: boolean;
  /** Mark-scheme points the answer earned (verbatim from `markPoints`). */
  awardedPoints: string[];
  /** Mark-scheme points the answer missed. */
  missedPoints: string[];
  /** A named misconception, when one is detected — drives targeted review. */
  misconception?: string;
  /** Specific, encouraging feedback — never just "wrong". */
  feedback: string;
}

/** What the client renders when the API key is absent (graceful degrade). */
export interface AiStatus {
  available: boolean;
}

/** Uniform error body for AI routes so the client can branch on `reason`. */
export interface AiErrorBody {
  error: string;
  /**
   * `unavailable` → no key / not authorised on this device; `upstream` →
   * upstream model error; `bad_request`; `rate_limited` → shared daily cap reached.
   */
  reason: "unavailable" | "upstream" | "bad_request" | "rate_limited";
}
