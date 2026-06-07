"use client";

/**
 * The progress hub. Wraps the ProgressStore with React state, injects `today`
 * and the resolved RewardConfig, and exposes the pure engine actions as simple
 * callbacks. Persists to localStorage on every change, and — when the family
 * access code is set — mirrors to Firestore for cross-device sync.
 *
 * Sync model (see lib/sync): localStorage is the instant local cache; the
 * server is the source of truth. On load we pull and adopt whichever copy has
 * the larger `updatedISO`; on change we push (debounced). A stale push is
 * rejected (409) and the server's copy adopted instead, so banked progress is
 * never clobbered by an out-of-date device.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { UNITS, getUnit, rewardUnitIds } from "@/content/index";
import { syncUnlockedThemes } from "@/lib/cosmetics/themes";
import * as actions from "@/lib/engine/actions";
import type { AttemptOutcome, GradedTest } from "@/lib/engine/actions";
import { syncUnitStatuses } from "@/lib/engine/gating";
import { resolveRewardConfig } from "@/lib/rewards/config";
import type { RewardConfig } from "@/lib/rewards/types";
import type { ReviewGrade } from "@/lib/srs/sm2";
import { pullProgress, pushProgress, setAccessCode, verifyAccessCode } from "@/lib/sync/client";
import { todayISO } from "@/lib/util/dates";
import { createInitialProgress } from "./defaults";
import { progressStore } from "./localStorageStore";
import type { LearnerProgress } from "./types";

/**
 * - `connecting` — checking the server on load
 * - `local`      — server has no sync configured; this device is standalone
 * - `needs-code` — sync is on but we don't hold a valid family code yet
 * - `synced`     — connected and up to date with the server
 * - `offline`    — server unreachable right now; changes retry automatically
 */
export type SyncState = "connecting" | "local" | "needs-code" | "synced" | "offline";

interface CommitOpts {
  /** Surface newly-unlocked cosmetics as a toast (default true). */
  announce?: boolean;
  /** Bump `updatedISO` to now — true for local edits, false when adopting a
   * loaded/remote copy so its timestamp is preserved (default true). */
  stamp?: boolean;
}

interface ProgressContextValue {
  progress: LearnerProgress;
  /** True once hydrated from localStorage (client only). */
  ready: boolean;
  config: RewardConfig;
  today: string;
  /** Theme ids unlocked this session, awaiting a celebratory toast. */
  pendingUnlocks: string[];
  clearPendingUnlocks: () => void;
  completeLesson: (unitId: string, lessonId: string) => void;
  recordDrill: (unitId: string, correct: boolean) => void;
  recordAttempt: (unitId: string, graded: GradedTest) => AttemptOutcome;
  reviewCard: (cardId: string, unitId: string, grade: ReviewGrade) => void;
  /** Generic escape hatch for settings / theme / reward overrides. */
  update: (mutator: (p: LearnerProgress) => LearnerProgress) => void;
  exportJSON: () => string;
  importJSON: (json: string) => void;
  reset: () => void;
  /** Cross-device sync status, for the header indicator + access-code gate. */
  syncState: SyncState;
  /** Submit the family access code; resolves true if accepted (or sync is off). */
  submitAccessCode: (code: string) => Promise<boolean>;
  /** Dismiss the access-code gate and keep using this device standalone. */
  dismissSync: () => void;
  /** Re-open the access-code gate (e.g. to link a device that was dismissed). */
  requestSync: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const nowISO = (): string => new Date().toISOString();

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LearnerProgress>(() => createInitialProgress());
  const [ready, setReady] = useState(false);
  const [today] = useState(() => todayISO());
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("connecting");
  const progressRef = useRef(progress);
  // `updatedISO` we last reconciled with the server — guards the push effect so
  // adopting a remote copy doesn't immediately bounce it back.
  const lastSyncedISORef = useRef<string | null>(null);

  const setBoth = useCallback((p: LearnerProgress) => {
    progressRef.current = p;
    setProgress(p);
  }, []);

  const commit = useCallback(
    (next: LearnerProgress, opts: CommitOpts = {}) => {
      const { announce = true, stamp = true } = opts;
      const synced = syncUnitStatuses(UNITS, next);
      // Auto-earn cosmetics on every state change (monotone — never removes).
      const { progress: derived, newlyUnlocked } = syncUnlockedThemes(synced, rewardUnitIds());
      // Stamp last so the timestamp survives the derivations above.
      const withCosmetics: LearnerProgress = stamp
        ? { ...derived, updatedISO: nowISO() }
        : { ...derived, updatedISO: derived.updatedISO ?? next.updatedISO };
      progressStore.save(withCosmetics);
      setBoth(withCosmetics);
      if (announce && newlyUnlocked.length > 0) {
        setPendingUnlocks((prev) => [...prev, ...newlyUnlocked]);
      }
    },
    [setBoth],
  );

  // Push the current local copy to the server, adopting the server's copy on a
  // stale-write conflict (409). Always sends the freshest ref, not a closure.
  const doPush = useCallback(async () => {
    const res = await pushProgress(progressRef.current);
    if (res.kind === "ok") {
      lastSyncedISORef.current = res.updatedISO;
      setSyncState("synced");
    } else if (res.kind === "conflict") {
      lastSyncedISORef.current = res.updatedISO;
      commit(res.progress, { announce: false, stamp: false });
      setSyncState("synced");
    } else if (res.kind === "needs-code") {
      setSyncState("needs-code");
    } else {
      setSyncState("offline");
    }
  }, [commit]);

  // Pull on connect and adopt whichever copy is newer; otherwise seed the
  // server with our local copy.
  const reconcile = useCallback(async () => {
    const res = await pullProgress();
    if (res.kind === "unconfigured") return setSyncState("local");
    if (res.kind === "needs-code") return setSyncState("needs-code");
    if (res.kind === "unavailable") return setSyncState("offline");

    const local = progressRef.current;
    const remote = res.progress;
    if (remote && (!local.updatedISO || remote.updatedISO > local.updatedISO)) {
      lastSyncedISORef.current = remote.updatedISO;
      commit(remote, { announce: false, stamp: false });
      return setSyncState("synced");
    }
    // Local is newer (or the server is empty) — seed/overwrite the server.
    await doPush();
  }, [commit, doPush]);

  // One-time hydration from localStorage after mount, then kick off sync. The
  // post-mount sync is the canonical way to dodge an SSR/CSR mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    commit(progressStore.load(), { announce: false, stamp: false });
    setReady(true);
    void reconcile();
  }, [commit, reconcile]);

  // Debounced push whenever local state moves past what the server last saw.
  useEffect(() => {
    if (!ready) return;
    if (syncState !== "synced" && syncState !== "offline") return;
    if (progress.updatedISO === lastSyncedISORef.current) return;
    const t = setTimeout(() => void doPush(), 1200);
    return () => clearTimeout(t);
  }, [progress.updatedISO, ready, syncState, doPush]);

  const submitAccessCode = useCallback(
    async (code: string): Promise<boolean> => {
      const verdict = await verifyAccessCode(code);
      if (verdict === "ok") {
        setAccessCode(code);
        setSyncState("connecting");
        await reconcile();
        return true;
      }
      if (verdict === "unconfigured") {
        setSyncState("local");
        return true;
      }
      return false; // bad code or transient failure — let the gate show an error
    },
    [reconcile],
  );

  const dismissSync = useCallback(() => setSyncState("local"), []);

  const requestSync = useCallback(() => {
    // If we already hold a code, re-pull; otherwise prompt for it.
    setSyncState("connecting");
    void reconcile();
  }, [reconcile]);

  const clearPendingUnlocks = useCallback(() => setPendingUnlocks([]), []);

  const configFor = (p: LearnerProgress) => resolveRewardConfig(p.rewardConfigOverride);
  const config = useMemo(() => configFor(progress), [progress]);

  const completeLesson = useCallback(
    (unitId: string, lessonId: string) => {
      const p = progressRef.current;
      commit(actions.completeLesson(p, unitId, lessonId, today, configFor(p)));
    },
    [commit, today],
  );

  const recordDrill = useCallback(
    (unitId: string, correct: boolean) => {
      const p = progressRef.current;
      commit(actions.recordDrill(p, unitId, correct, today, configFor(p)));
    },
    [commit, today],
  );

  const recordAttempt = useCallback(
    (unitId: string, graded: GradedTest): AttemptOutcome => {
      const p = progressRef.current;
      const unit = getUnit(unitId);
      const outcome = actions.recordAttempt(p, unitId, graded, today, unit?.isRewardSector ?? false, configFor(p));
      let next = outcome.progress;
      if (outcome.newlyMastered && unit) {
        next = actions.seedReviews(next, unitId, unit.flashcards.map((f) => f.id), today);
      }
      commit(next);
      return outcome;
    },
    [commit, today],
  );

  const reviewCard = useCallback(
    (cardId: string, unitId: string, grade: ReviewGrade) => {
      const p = progressRef.current;
      commit(actions.reviewCard(p, cardId, unitId, grade, today, configFor(p)));
    },
    [commit, today],
  );

  const update = useCallback(
    (mutator: (p: LearnerProgress) => LearnerProgress) => commit(mutator(progressRef.current)),
    [commit],
  );

  const exportJSON = useCallback(() => progressStore.exportJSON(), []);
  const importJSON = useCallback(
    (json: string) => {
      const next = progressStore.importJSON(json); // throws on bad input
      commit(next, { announce: false }); // re-derive statuses + backfill cosmetics, silently
    },
    [commit],
  );
  const reset = useCallback(() => commit(progressStore.reset()), [commit]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      ready,
      config,
      today,
      pendingUnlocks,
      clearPendingUnlocks,
      completeLesson,
      recordDrill,
      recordAttempt,
      reviewCard,
      update,
      exportJSON,
      importJSON,
      reset,
      syncState,
      submitAccessCode,
      dismissSync,
      requestSync,
    }),
    [progress, ready, config, today, pendingUnlocks, clearPendingUnlocks, completeLesson, recordDrill, recordAttempt, reviewCard, update, exportJSON, importJSON, reset, syncState, submitAccessCode, dismissSync, requestSync],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
