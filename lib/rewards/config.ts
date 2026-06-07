import type { DeepPartial } from "@/lib/util/types";
import type { RewardConfig } from "./types";

/** Spec §11.3–11.4 defaults. Parents tune via a persisted DeepPartial override. */
export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  currency: "VND",
  totalCapVND: 1_000_000,
  rewardSectorCount: 5,
  mastery: {
    perSectorVND: 100_000,
    flawlessBonusVND: 20_000,
  },
  speedVault: {
    week4VND: 400_000,
    week5VND: 250_000,
    week6VND: 100_000,
    postWeek6PenaltyPerWeekVND: 50_000,
    postWeek6PenaltyCapVND: 150_000,
  },
  nintendo: {
    dailySessionMin: 30,
    weeklyActiveBonusMin: 60,
    weeklyActiveThreshold: 5,
    sectorClearMin: 120,
    dungeonClearMin: 480,
  },
  weeks: {
    fullVaultEndWeek: 4,
    targetEndWeek: 5,
    deadlineWeek: 6,
  },
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mergeDeep<T>(base: T, override?: DeepPartial<T>): T {
  if (override === undefined || override === null) return base;
  if (!isObject(base) || !isObject(override)) return (override as unknown as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override)) {
    const bv = (base as Record<string, unknown>)[k];
    out[k] = isObject(bv) && isObject(v) ? mergeDeep(bv, v as DeepPartial<typeof bv>) : v;
  }
  return out as T;
}

/** Resolve the effective config from defaults + a parent override. */
export function resolveRewardConfig(override?: DeepPartial<RewardConfig>): RewardConfig {
  return mergeDeep(DEFAULT_REWARD_CONFIG, override);
}
