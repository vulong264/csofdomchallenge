/**
 * `/api/grade` — free-text answer grading against a Cambridge 0478 mark scheme
 * (build step 4). Two modes: `exam` (strict, for `freetext` questions) and
 * `explain` (formative, for "explain it back"). Server-only — the key stays here.
 */
import { getUnit } from "@/content/index";
import { guardAiSpend } from "@/lib/ai/guard";
import { aiAvailable, gradeFreeText } from "@/lib/ai/server";
import type { AiErrorBody, GradeRequest } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(reason: AiErrorBody["reason"], status: number, error: string): Response {
  return Response.json({ error, reason } satisfies AiErrorBody, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!aiAvailable()) return err("unavailable", 503, "AI grading is not configured.");

  let body: GradeRequest;
  try {
    body = (await request.json()) as GradeRequest;
  } catch {
    return err("bad_request", 400, "Invalid JSON body.");
  }

  if (body.mode !== "exam" && body.mode !== "explain") {
    return err("bad_request", 400, "mode must be 'exam' or 'explain'.");
  }
  if (!getUnit(body.unitId)) return err("bad_request", 400, "Unknown unit.");
  if (typeof body.prompt !== "string" || typeof body.studentAnswer !== "string") {
    return err("bad_request", 400, "prompt and studentAnswer are required.");
  }

  // Family-code + daily-cap guard (claims one unit of the shared quota).
  const blocked = await guardAiSpend(request);
  if (blocked) return blocked;

  try {
    const grade = await gradeFreeText({
      ...body,
      prompt: body.prompt.slice(0, 4000),
      studentAnswer: body.studentAnswer.slice(0, 6000),
    });
    return Response.json(grade, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[grade] upstream error:", e);
    return err("upstream", 502, "Grading is unavailable right now.");
  }
}
