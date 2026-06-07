import type { LearnerProgress } from "./types";

/**
 * Storage seam. The app only depends on this interface, so the localStorage
 * implementation can be swapped wholesale.
 *
 * // TODO: swap to Vercel KV/Postgres for multi-device + a live parent dashboard.
 */
export interface ProgressStore {
  /** Load current progress, creating a fresh record on first run. */
  load(): LearnerProgress;
  /** Persist the whole progress object. */
  save(progress: LearnerProgress): void;
  /** Wipe and return a fresh record. */
  reset(): LearnerProgress;
  /** Serialise current progress as pretty JSON (for the Export button). */
  exportJSON(): string;
  /** Validate + adopt an imported JSON string; returns the normalised record. */
  importJSON(json: string): LearnerProgress;
}

export const STORAGE_KEY = "csofdoom.progress.v1";
