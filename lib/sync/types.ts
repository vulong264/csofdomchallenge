/**
 * Shared types for cross-device progress sync (laptop ⇆ phone ⇆ parent view).
 *
 * One learner ⇒ one Firestore document. The server is the source of truth;
 * each device pulls on load and pushes (debounced) on change, with the larger
 * `updatedISO` winning. Safe to import from both client and server.
 */
import type { LearnerProgress } from "@/lib/progress/types";

/** Header carrying the shared family access code on every sync request. */
export const ACCESS_CODE_HEADER = "x-access-code";

/** `GET /api/progress` — current server state for this learner. */
export interface PullResponse {
  /** True when the server has sync wired up (Firestore + a family code set). */
  configured: boolean;
  /** The stored progress, or null if the learner has never synced. */
  progress: LearnerProgress | null;
  /** `updatedISO` of the stored progress, or null when absent. */
  updatedISO: string | null;
}

/** `PUT /api/progress` body — the full progress blob to persist. */
export interface PushRequest {
  progress: LearnerProgress;
}

/** `PUT /api/progress` success — the authoritative state after the write. */
export interface PushResponse {
  ok: true;
  updatedISO: string;
}

/**
 * 409 conflict — the server already holds a strictly newer copy (another
 * device wrote in between). The client adopts `progress` instead of clobbering.
 */
export interface ConflictResponse {
  ok: false;
  reason: "conflict";
  progress: LearnerProgress;
  updatedISO: string;
}
