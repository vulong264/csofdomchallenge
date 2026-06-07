/**
 * `/api/tutor` — the Socratic AI tutor (build step 4).
 *
 * POST: streams the tutor's reply as plain text for a given unit + history.
 * GET:  reports whether AI is configured, so the client can render the static
 *       fallback (concept summary + misconceptions) when no key is present.
 *
 * Server-only: the Anthropic key lives here and is never sent to the client.
 */
import { getUnit } from "@/content/index";
import { aiAvailable, streamTutorReply } from "@/lib/ai/server";
import type { AiErrorBody, AiStatus, TutorMessage, TutorRequest } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ available: aiAvailable() } satisfies AiStatus);
}

function err(reason: AiErrorBody["reason"], status: number, error: string): Response {
  return Response.json({ error, reason } satisfies AiErrorBody, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!aiAvailable()) return err("unavailable", 503, "AI tutor is not configured.");

  let body: TutorRequest;
  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return err("bad_request", 400, "Invalid JSON body.");
  }

  const unit = getUnit(body.unitId);
  if (!unit) return err("bad_request", 400, "Unknown unit.");

  const messages: TutorMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const cleaned = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  // Conversation must be non-empty and start from the learner.
  if (cleaned.length === 0 || cleaned[0].role !== "user") {
    return err("bad_request", 400, "Conversation must start with a user message.");
  }

  try {
    const stream = streamTutorReply(
      {
        title: unit.title,
        syllabusRef: unit.syllabusRef,
        conceptSummary: unit.tutor.conceptSummary,
        misconceptions: unit.tutor.misconceptions,
      },
      cleaned,
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return err("upstream", 502, "The tutor is unavailable right now.");
  }
}
