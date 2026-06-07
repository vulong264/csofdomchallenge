import { describe, it, expect } from "vitest";
import { DEFAULT_REWARD_CONFIG as CFG, resolveRewardConfig } from "@/lib/rewards/config";
import {
  vaultContributionForWeek,
  speedVaultStatus,
  masteryBanked,
  projectedPayout,
  nintendoTotals,
} from "@/lib/rewards/compute";
import { defaultUnitProgress } from "@/lib/progress/defaults";
import type { UnitProgress } from "@/lib/progress/types";

const START = "2026-06-07";
const IDS = ["u1", "u2", "u3", "u4", "u5"];

function masteredUnit(id: string, flawless: boolean, date: string): UnitProgress {
  return {
    ...defaultUnitProgress(id, "mastered"),
    bestPercent: flawless ? 100 : 85,
    attemptsCount: flawless ? 1 : 2,
    flawlessEligible: flawless,
    flawlessAchieved: flawless,
    masteredLocalDate: date,
  };
}

function allMastered(flawless: boolean, date: string): Record<string, UnitProgress> {
  return Object.fromEntries(IDS.map((id) => [id, masteredUnit(id, flawless, date)]));
}

describe("speed-vault decay (§11.3 table)", () => {
  it("maps program weeks to payouts", () => {
    expect(vaultContributionForWeek(1, CFG)).toBe(400_000);
    expect(vaultContributionForWeek(4, CFG)).toBe(400_000);
    expect(vaultContributionForWeek(5, CFG)).toBe(250_000);
    expect(vaultContributionForWeek(6, CFG)).toBe(100_000);
    expect(vaultContributionForWeek(7, CFG)).toBe(-50_000);
    expect(vaultContributionForWeek(8, CFG)).toBe(-100_000);
    expect(vaultContributionForWeek(9, CFG)).toBe(-150_000);
    expect(vaultContributionForWeek(20, CFG)).toBe(-150_000); // penalty capped
  });

  it("shows the full vault and the date it first drops", () => {
    const v = speedVaultStatus(CFG, START, START);
    expect(v.value).toBe(400_000);
    expect(v.tier).toBe("full");
    expect(v.locked).toBe(false);
    expect(v.nextValue).toBe(250_000);
    expect(v.nextDropLocalDate).toBe("2026-07-05"); // start + 28 days
  });

  it("locks the value to the final-clear date once finished", () => {
    const v = speedVaultStatus(CFG, START, "2026-09-01", "2026-07-08"); // finished in week 5
    expect(v.value).toBe(250_000);
    expect(v.locked).toBe(true);
    expect(v.nextDropLocalDate).toBeUndefined();
  });
});

describe("mastery banking (monotone, never decreases)", () => {
  it("banks per sector + flawless bonus", () => {
    const units = {
      u1: masteredUnit("u1", true, "2026-06-20"),
      u2: masteredUnit("u2", false, "2026-06-27"),
    };
    const m = masteryBanked(units, IDS, CFG);
    expect(m.sectorsCleared).toBe(2);
    expect(m.flawlessCount).toBe(1);
    expect(m.bankedVND).toBe(2 * 100_000 + 1 * 20_000); // 220,000
  });
});

describe("projected payout", () => {
  it("best case: all flawless by week 4 hits the 1,000,000 cap", () => {
    const p = projectedPayout(allMastered(true, "2026-06-28"), IDS, CFG, START, "2026-06-28");
    expect(p.bankedMasteryVND).toBe(600_000);
    expect(p.vault.value).toBe(400_000);
    expect(p.projectedTotalVND).toBe(1_000_000);
  });

  it("target case: all first-try by week 5 = 850,000", () => {
    const p = projectedPayout(allMastered(true, "2026-07-08"), IDS, CFG, START, "2026-07-08");
    expect(p.projectedTotalVND).toBe(850_000);
  });

  it("never exceeds the cap", () => {
    const p = projectedPayout(allMastered(true, "2026-06-10"), IDS, CFG, START, "2026-06-10");
    expect(p.projectedTotalVND).toBeLessThanOrEqual(CFG.totalCapVND);
  });

  it("overdue: penalty reduces the total but the mastery line stays banked", () => {
    const p = projectedPayout(allMastered(true, "2026-08-15"), IDS, CFG, START, "2026-08-15");
    expect(p.bankedMasteryVND).toBe(600_000); // mastery never decreases
    expect(p.vault.value).toBe(-150_000); // capped penalty
    expect(p.projectedTotalVND).toBe(450_000); // 600k − 150k
  });
});

describe("config override + nintendo totals", () => {
  it("deep-merges a parent override without dropping siblings", () => {
    const cfg = resolveRewardConfig({ mastery: { perSectorVND: 50_000 } });
    expect(cfg.mastery.perSectorVND).toBe(50_000);
    expect(cfg.mastery.flawlessBonusVND).toBe(20_000); // untouched
    expect(cfg.speedVault.week4VND).toBe(400_000);
  });

  it("totals all Nintendo minutes and this week's", () => {
    const entries = [
      { localDate: "2026-06-07", minutes: 30 }, // week 1
      { localDate: "2026-06-09", minutes: 120 }, // week 1
      { localDate: "2026-06-20", minutes: 30 }, // week 2
    ];
    const t = nintendoTotals(entries, START, "2026-06-09");
    expect(t.totalMin).toBe(180);
    expect(t.thisWeekMin).toBe(150);
  });
});
