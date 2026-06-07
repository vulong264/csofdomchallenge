/**
 * Server-only AI plumbing for the tutor + free-text grader (build step 4).
 *
 * Backed by the Google Gemini API. INVARIANT (CLAUDE.md): the API key never
 * reaches the client bundle — `import "server-only"` makes any accidental
 * client import a build error, and this module is only imported from
 * `app/api/*` route handlers. AI degrades gracefully to static content when the
 * key is absent.
 *
 * Models: a Flash-class model for the conversational tutor, a cheaper
 * Flash-Lite model for inline grading — both overridable via env. Gemini 2.5's
 * "thinking" is disabled (thinkingBudget 0) to keep replies fast.
 */
import "server-only";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { graderSystemPrompt, graderUserPrompt, tutorSystemPrompt, type TutorScope } from "./prompts";
import type { GradeRequest, GradeResponse, TutorMessage } from "./types";

const TUTOR_MODEL = process.env.GEMINI_TUTOR_MODEL || "gemini-2.5-flash";
const GRADER_MODEL = process.env.GEMINI_GRADER_MODEL || "gemini-2.5-flash-lite";

export function aiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

let cached: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (!cached) cached = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return cached;
}

/** Map our tutor turns to Gemini `contents` (Gemini uses "model", not "assistant"). */
function toContents(messages: TutorMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Stream the tutor's reply as plain UTF-8 text chunks. Latency-sensitive chat,
 * so thinking is disabled — the system prompt does the heavy lifting. Caller is
 * responsible for the `aiAvailable()` pre-check.
 *
 * Resolves only once the FIRST chunk is in hand: an upstream failure (bad key,
 * quota exhausted, rate limit) rejects this promise so the route can return a
 * real error status, instead of handing back an empty 200 stream that the
 * client renders as a silent dead bubble.
 */
export async function streamTutorReply(
  scope: TutorScope,
  messages: TutorMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const sdkStream = await client().models.generateContentStream({
    model: TUTOR_MODEL,
    contents: toContents(messages),
    config: {
      systemInstruction: tutorSystemPrompt(scope),
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  async function* deltas(): AsyncGenerator<string> {
    for await (const chunk of sdkStream) {
      const text = chunk.text;
      if (text) yield text;
    }
  }
  const iter = deltas();
  // Surface a pre-stream failure as a thrown error (caught by the route → 502).
  const first = await iter.next();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        for await (const text of iter) {
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        // Mid-stream failure (rate limit, network) after some text already sent:
        // log for observability, then close so the client keeps what arrived.
        console.error("[tutor] stream error mid-response:", err);
        controller.close();
      }
    },
  });
}

/** Gemini response schema for the grade — guarantees a parseable JSON shape. */
const GRADE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    marksAwarded: { type: Type.INTEGER, description: "Marks earned by the answer." },
    maxMarks: { type: Type.INTEGER, description: "Maximum marks available." },
    correct: { type: Type.BOOLEAN, description: "Whether the answer meets the bar." },
    awardedPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Mark-scheme points the answer earned (brief paraphrase).",
    },
    missedPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Mark-scheme points the answer missed (brief paraphrase).",
    },
    misconception: {
      type: Type.STRING,
      description: "A specific misconception the answer reveals, or empty string if none.",
    },
    feedback: { type: Type.STRING, description: "Specific, encouraging feedback for the learner." },
  },
  required: ["marksAwarded", "maxMarks", "correct", "awardedPoints", "missedPoints", "misconception", "feedback"],
  propertyOrdering: ["marksAwarded", "maxMarks", "correct", "awardedPoints", "missedPoints", "misconception", "feedback"],
};

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
 * Grade a free-text answer against a Cambridge-style mark scheme. Flash-Lite
 * with JSON structured output; thinking disabled. Caller pre-checks
 * `aiAvailable()`.
 */
export async function gradeFreeText(req: GradeRequest): Promise<GradeResponse> {
  const declaredMax = req.maxMarks ?? req.markPoints?.length ?? 1;

  const response = await client().models.generateContent({
    model: GRADER_MODEL,
    contents: graderUserPrompt(req),
    config: {
      systemInstruction: graderSystemPrompt(req),
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: GRADE_SCHEMA,
    },
  });

  const raw = JSON.parse(response.text ?? "{}") as RawGrade;

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
