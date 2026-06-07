/**
 * Browser-side fetch helpers for the AI routes (build step 4). These talk to
 * `/api/tutor` and `/api/grade` — the Anthropic key lives only behind those
 * routes, never here. Safe to import from client components.
 */
import { getAccessCode } from "@/lib/sync/client";
import { ACCESS_CODE_HEADER } from "@/lib/sync/types";
import type { AiErrorBody, GradeRequest, GradeResponse, TutorRequest } from "./types";

/** Thrown by the helpers below; `reason: "unavailable"` ⇒ no API key configured. */
export class AiError extends Error {
  reason: AiErrorBody["reason"] | "network";
  constructor(reason: AiError["reason"], message: string) {
    super(message);
    this.name = "AiError";
    this.reason = reason;
  }
}

/**
 * Attach the family access code (when this device holds one) so the guarded AI
 * routes admit the request. Without it, the routes treat AI as unavailable.
 */
function withCode(base: Record<string, string> = {}): Record<string, string> {
  const code = getAccessCode();
  return code ? { ...base, [ACCESS_CODE_HEADER]: code } : base;
}

/** Is the AI tutor/grader configured AND authorised on this device? */
export async function fetchAiStatus(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch("/api/tutor", { method: "GET", headers: withCode(), signal });
    if (!res.ok) return false;
    const body = (await res.json()) as { available?: boolean };
    return !!body.available;
  } catch {
    return false;
  }
}

async function toAiError(res: Response): Promise<AiError> {
  try {
    const body = (await res.json()) as AiErrorBody;
    return new AiError(body.reason ?? "upstream", body.error ?? "Request failed.");
  } catch {
    return new AiError("upstream", `Request failed (${res.status}).`);
  }
}

/**
 * Stream a tutor reply. Calls `onChunk` with each text delta as it arrives and
 * resolves with the full text. Throws `AiError` on failure.
 */
export async function streamTutor(
  req: TutorRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/tutor", {
      method: "POST",
      headers: withCode({ "Content-Type": "application/json" }),
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    throw new AiError("network", "Couldn't reach the tutor.");
  }

  if (!res.ok || !res.body) throw await toAiError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }
  return full;
}

/** Grade a free-text answer. Throws `AiError` on failure. */
export async function gradeAnswer(req: GradeRequest, signal?: AbortSignal): Promise<GradeResponse> {
  let res: Response;
  try {
    res = await fetch("/api/grade", {
      method: "POST",
      headers: withCode({ "Content-Type": "application/json" }),
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    throw new AiError("network", "Couldn't reach the grader.");
  }
  if (!res.ok) throw await toAiError(res);
  return (await res.json()) as GradeResponse;
}
