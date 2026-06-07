/**
 * Server-only guard for the public AI spend endpoints (/api/tutor POST,
 * /api/grade POST). Two layers, both active only when the family access code
 * is configured (so local dev without it stays unguarded):
 *
 *   1. Family access code — the same `x-access-code` header that gates
 *      /api/progress. A device must hold the code to spend on AI.
 *   2. Shared per-day cap — one Firestore-backed counter across all instances,
 *      so a leaked code or a runaway client can't run up an unbounded bill.
 *
 * The cap is `AI_DAILY_CAP` (default 300) requests/day, keyed by UTC date.
 */
import "server-only";
import { codeMatches, consumeDailyQuota, syncConfigured } from "@/lib/sync/server";
import type { AiErrorBody } from "@/lib/ai/types";
import { ACCESS_CODE_HEADER } from "@/lib/sync/types";

const DEFAULT_DAILY_CAP = 300;

function dailyCap(): number {
  const n = Number(process.env.AI_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAILY_CAP;
}

/** UTC calendar day, e.g. "2026-06-07" — the per-day bucket key. */
function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function deny(reason: AiErrorBody["reason"], status: number, error: string): Response {
  return Response.json({ error, reason } satisfies AiErrorBody, { status });
}

/**
 * Family-code check for the AI *status* endpoint (GET /api/tutor). No quota is
 * consumed. When the code is configured, a device without it sees AI as
 * unavailable and falls back to static content — identical to having no key.
 */
export function aiCodeOk(request: Request): boolean {
  if (!syncConfigured()) return true; // unguarded (local/dev)
  return codeMatches(request.headers.get(ACCESS_CODE_HEADER));
}

/**
 * Guard an AI spend request: require the family code, then claim one unit of
 * the shared daily quota. Returns an error Response when blocked, or null to
 * proceed. No-op when the family code isn't configured. Fails OPEN on a
 * Firestore hiccup — the caller is already an authenticated family member, so
 * a transient counter outage shouldn't block legitimate study.
 */
export async function guardAiSpend(request: Request): Promise<Response | null> {
  if (!syncConfigured()) return null;

  if (!codeMatches(request.headers.get(ACCESS_CODE_HEADER))) {
    return deny("unavailable", 401, "AI isn't available on this device — link it with the family code.");
  }

  const cap = dailyCap();
  try {
    const claim = await consumeDailyQuota(cap, utcDayKey());
    if (!claim.ok) {
      return deny("rate_limited", 429, `Daily AI limit reached (${cap}/day). Try again tomorrow.`);
    }
  } catch {
    return null; // fail open for an authenticated family member
  }
  return null;
}
