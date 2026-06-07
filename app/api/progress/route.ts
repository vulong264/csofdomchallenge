/**
 * `/api/progress` — cross-device progress sync (laptop ⇆ phone ⇆ parent view).
 *
 *   GET : current server state for this learner (or `configured:false`).
 *   PUT : persist a progress blob; 409 if the server already holds a newer one.
 *
 * Both require the shared family code (header `x-access-code`) once sync is
 * configured. Server-only: Firestore credentials never reach the client.
 */
import { normalizeProgress } from "@/lib/progress/defaults";
import { codeMatches, loadRemote, saveRemote, syncConfigured } from "@/lib/sync/server";
import {
  ACCESS_CODE_HEADER,
  type ConflictResponse,
  type PullResponse,
  type PushRequest,
  type PushResponse,
} from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () => Response.json({ error: "Bad access code." }, { status: 401 });

export async function GET(request: Request): Promise<Response> {
  if (!syncConfigured()) {
    return Response.json({ configured: false, progress: null, updatedISO: null } satisfies PullResponse);
  }
  if (!codeMatches(request.headers.get(ACCESS_CODE_HEADER))) return unauthorized();

  try {
    const remote = await loadRemote();
    return Response.json({
      configured: true,
      progress: remote?.progress ?? null,
      updatedISO: remote?.updatedISO ?? null,
    } satisfies PullResponse);
  } catch {
    // Firestore hiccup: report configured-but-unavailable so the client keeps
    // working locally and retries on the next load.
    return Response.json({ error: "Sync store unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  if (!syncConfigured()) return Response.json({ error: "Sync not configured." }, { status: 503 });
  if (!codeMatches(request.headers.get(ACCESS_CODE_HEADER))) return unauthorized();

  let body: PushRequest;
  try {
    body = (await request.json()) as PushRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body?.progress || typeof body.progress !== "object" || !("learnerName" in body.progress)) {
    return Response.json({ error: "Not a progress payload." }, { status: 400 });
  }

  const progress = normalizeProgress(body.progress);
  try {
    const result = await saveRemote(progress);
    if (result.written) {
      return Response.json({ ok: true, updatedISO: result.updatedISO } satisfies PushResponse);
    }
    return Response.json(
      {
        ok: false,
        reason: "conflict",
        progress: result.conflict.progress,
        updatedISO: result.conflict.updatedISO,
      } satisfies ConflictResponse,
      { status: 409 },
    );
  } catch {
    return Response.json({ error: "Sync store unavailable." }, { status: 503 });
  }
}
