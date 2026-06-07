/**
 * Reward economy configuration (spec §11.3–11.4). Every dial lives here so a
 * parent can re-tune the scheme without touching code. All cash is in VND.
 */
export interface RewardConfig {
  currency: "VND";
  /** Hard cap on total payout (mastery + vault). */
  totalCapVND: number;
  /** Number of reward-bearing sectors (the 5 real units; the tutorial doesn't count). */
  rewardSectorCount: number;

  mastery: {
    /** Banked per boss cleared at ≥80%. */
    perSectorVND: number;
    /** Bonus per sector cleared ≥80% on the FIRST attempt (Flawless). */
    flawlessBonusVND: number;
  };

  speedVault: {
    /** All sectors cleared by end of week 4 (or sooner). */
    week4VND: number;
    /** …by end of week 5 (the target). */
    week5VND: number;
    /** …by end of week 6 (the deadline). */
    week6VND: number;
    /** After week 6: vault = 0, then this much deducted per extra week… */
    postWeek6PenaltyPerWeekVND: number;
    /** …capped at this total deduction. */
    postWeek6PenaltyCapVND: number;
  };

  nintendo: {
    dailySessionMin: number;
    weeklyActiveBonusMin: number;
    weeklyActiveThreshold: number; // active days in a week to earn the bonus
    sectorClearMin: number;
    dungeonClearMin: number;
  };

  /** Week thresholds, expressed as the program week each tier closes. */
  weeks: {
    fullVaultEndWeek: number; // 4
    targetEndWeek: number; // 5
    deadlineWeek: number; // 6
  };
}
