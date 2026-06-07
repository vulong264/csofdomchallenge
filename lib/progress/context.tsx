"use client";

/**
 * The progress hub. Wraps the ProgressStore with React state, injects `today`
 * and the resolved RewardConfig, and exposes the pure engine actions as simple
 * callbacks. Everything persists to localStorage on every change.
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
import { todayISO } from "@/lib/util/dates";
import { createInitialProgress } from "./defaults";
import { progressStore } from "./localStorageStore";
import type { LearnerProgress } from "./types";

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
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LearnerProgress>(() => createInitialProgress());
  const [ready, setReady] = useState(false);
  const [today] = useState(() => todayISO());
  const [pendingUnlocks, setPendingUnlocks] = useState<string[]>([]);
  const progressRef = useRef(progress);

  const setBoth = useCallback((p: LearnerProgress) => {
    progressRef.current = p;
    setProgress(p);
  }, []);

  const commit = useCallback(
    (next: LearnerProgress, announce = true) => {
      const synced = syncUnitStatuses(UNITS, next);
      // Auto-earn cosmetics on every state change (monotone — never removes).
      const { progress: withCosmetics, newlyUnlocked } = syncUnlockedThemes(synced, rewardUnitIds());
      progressStore.save(withCosmetics);
      setBoth(withCosmetics);
      if (announce && newlyUnlocked.length > 0) {
        setPendingUnlocks((prev) => [...prev, ...newlyUnlocked]);
      }
    },
    [setBoth],
  );

  // One-time hydration from localStorage after mount — the canonical way to
  // avoid an SSR/CSR mismatch (the server can't read localStorage). A single
  // post-mount sync is exactly what the set-state-in-effect rule is not about.
  // Hydration persists any backfilled unlocks but stays silent (no toast burst).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    commit(progressStore.load(), false);
    setReady(true);
  }, [commit]);

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
      commit(next, false); // re-derive statuses + backfill cosmetics, silently
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
    }),
    [progress, ready, config, today, pendingUnlocks, clearPendingUnlocks, completeLesson, recordDrill, recordAttempt, reviewCard, update, exportJSON, importJSON, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
