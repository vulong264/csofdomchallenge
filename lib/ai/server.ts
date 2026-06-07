/**
 * Server-only AI plumbing for the tutor + free-text grader (build step 4).
 *
 * INVARIANT (CLAUDE.md): the Anthropic key never reaches the client bundle.
 * The `import "server-only"` below makes any accidental client import a build
 * error, and this module is only ever imported from `app/api/*` route handlers.
 * AI degrades gracefully to static content when the key is absent.
 *
 * Models (spec §stack): a Sonnet-class model for the conversational tutor, a
 * Haiku-class model for cheap inline grading — both overridable via env.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { graderSystemPrompt, graderUserPrompt, tutorSystemPrompt, type TutorScope } from "./prompts";
import type { GradeRequest, GradeResponse, TutorMessage } from "./types";

const TUTOR_MODEL = process.env.ANTHROPIC_TUTOR_MODEL || "claude-sonnet-4-6";
const GRADER_MODEL = process.env.ANTHROPIC_GRADER_MODEL || "claude-haiku-4-5";

export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cached;
}

/**
 * Stream the tutor's reply as plain UTF-8 text chunks. Latency-sensitive chat,
 * so thinking is off and effort is low — the system prompt does the heavy
 * lifting. Caller is responsible for the `aiAvailable()` pre-check.
 */
export function streamTutorReply(scope: TutorScope, messages: TutorMessage[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sdkStream = client().messages.stream({
    model: TUTOR_MODEL,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: tutorSystemPrompt(scope),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of sdkStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch {
        // Mid-stream failure (rate limit, network): close cleanly so the client
        // keeps whatever text arrived and shows a non-fatal hiccup notice.
        controller.close();
      }
    },
    cancel() {
      sdkStream.abort();
    },
  });
}

/** JSON schema for the grade — structured outputs guarantee a parseable shape. */
const GRADE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    marksAwarded: { type: "integer", description: "Marks earned by the answer." },
    maxMarks: { type: "integer", description: "Maximum marks available." },
    correct: { type: "boolean", description: "Whether the answer meets the bar." },
    awardedPoints: {
      type: "array",
      items: { type: "string" },
      description: "Mark-scheme points the answer earned (brief paraphrase).",
    },
    missedPoints: {
      type: "array",
      items: { type: "string" },
      description: "Mark-scheme points the answer missed (brief paraphrase).",
    },
    misconception: {
      type: "string",
      description: "A specific misconception the answer reveals, or empty string if none.",
    },
    feedback: { type: "string", description: "Specific, encouraging feedback for the learner." },
  },
  required: ["marksAwarded", "maxMarks", "correct", "awardedPoints", "missedPoints", "misconception", "feedback"],
} as const;

interface RawGrade {
  marksAwarded: number;
  maxMarks: number;
  correct: boolean;
  awardedPoints: string[];
  missedPoints: string[];
  misconception: string;
  feedback: string;
}

/**
 * Grade a free-text answer against a Cambridge-style mark scheme. Haiku-class
 * model with structured output; no `effort`/`thinking` (unsupported on Haiku
 * and unnecessary here). Caller pre-checks `aiAvailable()`.
 */
export async function gradeFreeText(req: GradeRequest): Promise<GradeResponse> {
  const declaredMax = req.maxMarks ?? req.markPoints?.length ?? 1;

  const message = await client().messages.create({
    model: GRADER_MODEL,
    max_tokens: 1024,
    system: graderSystemPrompt(req),
    messages: [{ role: "user", content: graderUserPrompt(req) }],
    output_config: { format: { type: "json_schema", schema: GRADE_SCHEMA } },
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const raw = JSON.parse(text) as RawGrade;

  // Clamp to a sane range — the model can over-/under-shoot the declared max.
  const maxMarks = raw.maxMarks > 0 ? raw.maxMarks : declaredMax;
  const marksAwarded = Math.max(0, Math.min(raw.marksAwarded, maxMarks));

  return {
    marksAwarded,
    maxMarks,
    correct: raw.correct,
    awardedPoints: raw.awardedPoints ?? [],
    missedPoints: raw.missedPoints ?? [],
    misconception: raw.misconception?.trim() ? raw.misconception.trim() : undefined,
    feedback: raw.feedback,
  };
}
