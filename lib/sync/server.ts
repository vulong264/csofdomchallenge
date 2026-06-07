/**
 * Server-only sync plumbing: a single Firestore document per learner.
 *
 * INVARIANT (CLAUDE.md): localStorage is the dev seam; this is the "DB later".
 * On Cloud Run the Firestore client authenticates via the service account's
 * Application Default Credentials — no key file, nothing in the client bundle.
 *
 * The progress blob is stored as a JSON string (`json` field) so Firestore's
 * value constraints (no nested arrays, no `undefined`) never bite us, plus a
 * mirrored `updatedISO` for last-write-wins reconciliation.
 *
 * Sync is "configured" only when FAMILY_ACCESS_CODE is set: that gates the
 * public API and keeps local dev (no env) cleanly local-only.
 */
import "server-only";
import { Firestore } from "@google-cloud/firestore";
import { normalizeProgress } from "@/lib/progress/defaults";
import type { LearnerProgress } from "@/lib/progress/types";

const COLLECTION = "learners";
const DOC_ID = process.env.LEARNER_DOC_ID || "tom";

interface StoredDoc {
  json: string;
  updatedISO: string;
}

/** Is cross-device sync wired up? Drives the client's local-only fallback. */
export function syncConfigured(): boolean {
  return !!process.env.FAMILY_ACCESS_CODE;
}

/** Constant-time-ish compare of a supplied code against the family code. */
export function codeMatches(code: string | null): boolean {
  const expected = process.env.FAMILY_ACCESS_CODE;
  if (!expected || !code) return false;
  if (code.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= code.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

let cached: Firestore | null = null;
function db(): Firestore {
  // projectId + credentials are resolved from ADC on Cloud Run.
  if (!cached) cached = new Firestore({ ignoreUndefinedProperties: true });
  return cached;
}

function docRef() {
  return db().collection(COLLECTION).doc(DOC_ID);
}

/** Read the learner's stored progress, or null if they've never synced. */
export async function loadRemote(): Promise<{ progress: LearnerProgress; updatedISO: string } | null> {
  const snap = await docRef().get();
  if (!snap.exists) return null;
  const data = snap.data() as StoredDoc | undefined;
  if (!data?.json) return null;
  const progress = normalizeProgress(JSON.parse(data.json));
  return { progress, updatedISO: progress.updatedISO ?? data.updatedISO };
}

export type SaveResult =
  | { written: true; updatedISO: string }
  | { written: false; conflict: { progress: LearnerProgress; updatedISO: string } };

/**
 * Persist progress, rejecting a stale write. Runs in a transaction so two
 * devices racing can't interleave: if the stored copy is strictly newer than
 * the incoming one, we keep the stored copy and report a conflict.
 */
export async function saveRemote(progress: LearnerProgress): Promise<SaveResult> {
  const ref = docRef();
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? (snap.data() as StoredDoc | undefined) : undefined;
    if (existing?.updatedISO && existing.updatedISO > progress.updatedISO) {
      const current = normalizeProgress(JSON.parse(existing.json));
      return {
        written: false as const,
        conflict: { progress: current, updatedISO: current.updatedISO ?? existing.updatedISO },
      };
    }
    const stored: StoredDoc = { json: JSON.stringify(progress), updatedISO: progress.updatedISO };
    tx.set(ref, stored);
    return { written: true as const, updatedISO: progress.updatedISO };
  });
}
