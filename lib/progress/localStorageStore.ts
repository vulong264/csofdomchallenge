import { createInitialProgress, normalizeProgress } from "./defaults";
import { STORAGE_KEY, type ProgressStore } from "./store";
import type { LearnerProgress } from "./types";

/**
 * localStorage-backed ProgressStore. SSR-safe: on the server (no window) it
 * returns a fresh in-memory record so components can render before hydration.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private readonly key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  load(): LearnerProgress {
    if (typeof window === "undefined") return createInitialProgress();
    const raw = window.localStorage.getItem(this.key);
    if (!raw) {
      const init = createInitialProgress();
      this.save(init);
      return init;
    }
    try {
      return normalizeProgress(JSON.parse(raw));
    } catch {
      const init = createInitialProgress();
      this.save(init);
      return init;
    }
  }

  save(progress: LearnerProgress): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(this.key, JSON.stringify(progress));
  }

  reset(): LearnerProgress {
    const init = createInitialProgress();
    this.save(init);
    return init;
  }

  exportJSON(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  importJSON(json: string): LearnerProgress {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("That file isn't valid JSON.");
    }
    if (!parsed || typeof parsed !== "object" || !("learnerName" in parsed)) {
      throw new Error("That doesn't look like a CS of Doom progress file.");
    }
    const normalised = normalizeProgress(parsed);
    this.save(normalised);
    return normalised;
  }
}

/** Shared singleton used by the React provider. */
export const progressStore: ProgressStore = new LocalStorageProgressStore();
