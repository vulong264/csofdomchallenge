/**
 * Cosmetic "loot" themes (spec §11.1 — XP/levels unlock cosmetics, never cash).
 *
 * Each theme is pure metadata + an unlock rule expressed over a small derived
 * stats object. The actual colours live in `app/globals.css` keyed by
 * `[data-theme="<id>"]`; this file is the single source of truth for *which*
 * themes exist, how they're earned, and how they preview in the Loot gallery.
 *
 * Invariant: cosmetics are decorative only — unlocking or equipping one never
 * touches XP, mastery cash, or the reward economy.
 */
import type { LearnerProgress } from "@/lib/progress/types";

export const DEFAULT_THEME_ID = "doom";

/** Compact view of progress that unlock rules read — keeps rules pure & testable. */
export interface CosmeticStats {
  level: number;
  sectorsMastered: number; // reward-bearing units cleared at ≥80%
  flawlessCount: number; // reward sectors cleared flawless
  longestStreak: number;
  dungeonCleared: boolean; // every reward sector mastered
}

export interface ThemeSwatch {
  bg: string;
  surface: string;
  primary: string;
  accent: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  /** Flavour line shown in the gallery. */
  blurb: string;
  emoji: string;
  /** How to earn it (shown when still locked). */
  unlockLabel: string;
  /** Pure predicate over derived stats; the default theme is always unlocked. */
  unlock: (s: CosmeticStats) => boolean;
  /** Mini preview colours (must mirror the CSS in globals.css). */
  swatch: ThemeSwatch;
}

/**
 * The loot table. Ordered roughly by how deep into the dungeon you earn them.
 * Keep `swatch` in sync with the `[data-theme]` blocks in globals.css.
 */
export const THEMES: ThemeDef[] = [
  {
    id: "doom",
    name: "Doom (default)",
    blurb: "The standard-issue dungeon kit. Violet torchlight on cold stone.",
    emoji: "💀",
    unlockLabel: "Unlocked from the start",
    unlock: () => true,
    swatch: { bg: "#0a0a0f", surface: "#1b1b2b", primary: "#7c5cff", accent: "#ffc24b" },
  },
  {
    id: "ember",
    name: "Ember Forge",
    blurb: "Clear your first sector and the forge roars to life — molten reds.",
    emoji: "🔥",
    unlockLabel: "Clear your first sector",
    unlock: (s) => s.sectorsMastered >= 1,
    swatch: { bg: "#140a08", surface: "#2a1410", primary: "#ff6a3d", accent: "#ffb43d" },
  },
  {
    id: "abyss",
    name: "Deep Abyss",
    blurb: "Reach Level 3 and descend into the cold blue deep.",
    emoji: "🌊",
    unlockLabel: "Reach Level 3",
    unlock: (s) => s.level >= 3,
    swatch: { bg: "#06101a", surface: "#0f2233", primary: "#2fa8ff", accent: "#36e0c8" },
  },
  {
    id: "gold",
    name: "Gold Hoard",
    blurb: "A single Flawless boss kill earns the dragon's treasure room.",
    emoji: "🪙",
    unlockLabel: "Earn one Flawless clear",
    unlock: (s) => s.flawlessCount >= 1,
    swatch: { bg: "#15110a", surface: "#2a2212", primary: "#f2c14e", accent: "#ffe08a" },
  },
  {
    id: "frost",
    name: "Frost Keep",
    blurb: "Keep a 7-day streak alive and the keep freezes over — icy cyans.",
    emoji: "❄️",
    unlockLabel: "Hit a 7-day streak",
    unlock: (s) => s.longestStreak >= 7,
    swatch: { bg: "#080f14", surface: "#13222b", primary: "#56c6e6", accent: "#aef0ff" },
  },
  {
    id: "toxic",
    name: "Toxic Vault",
    blurb: "Master three sectors to crack the hazmat vault — radioactive greens.",
    emoji: "☣️",
    unlockLabel: "Master three sectors",
    unlock: (s) => s.sectorsMastered >= 3,
    swatch: { bg: "#0a1208", surface: "#15240f", primary: "#7ee03a", accent: "#c8ff4d" },
  },
  {
    id: "void",
    name: "Void Sovereign",
    blurb: "Clear the whole dungeon. The endgame skin — obsidian and starlight.",
    emoji: "👑",
    unlockLabel: "Clear all five sectors",
    unlock: (s) => s.dungeonCleared,
    swatch: { bg: "#05040a", surface: "#16122a", primary: "#b08cff", accent: "#ff7ad9" },
  },
];

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Derive the compact unlock-stats from full progress + the reward unit ids. */
export function cosmeticStats(progress: LearnerProgress, rewardUnitIds: string[]): CosmeticStats {
  let sectorsMastered = 0;
  let flawlessCount = 0;
  for (const id of rewardUnitIds) {
    const up = progress.units[id];
    if (up?.status === "mastered") {
      sectorsMastered += 1;
      if (up.flawlessAchieved) flawlessCount += 1;
    }
  }
  return {
    level: progress.level,
    sectorsMastered,
    flawlessCount,
    longestStreak: progress.streak.longest,
    dungeonCleared: rewardUnitIds.length > 0 && sectorsMastered === rewardUnitIds.length,
  };
}

/** Every theme id the learner has earned (always includes the default). */
export function earnedThemeIds(stats: CosmeticStats): string[] {
  return THEMES.filter((t) => t.unlock(stats)).map((t) => t.id);
}

export function isThemeUnlocked(progress: LearnerProgress, themeId: string): boolean {
  return progress.cosmetics.unlocked.includes(`theme:${themeId}`) || themeId === DEFAULT_THEME_ID;
}

/**
 * Merge newly-earned themes into `cosmetics.unlocked` (stored as `theme:<id>`),
 * monotonically — nothing is ever removed. Returns the same object when there's
 * nothing new, plus the list of ids unlocked *this* call (for a toast).
 */
export interface UnlockSync {
  progress: LearnerProgress;
  newlyUnlocked: string[];
}

export function syncUnlockedThemes(progress: LearnerProgress, rewardUnitIds: string[]): UnlockSync {
  const stats = cosmeticStats(progress, rewardUnitIds);
  const earned = earnedThemeIds(stats);
  const have = new Set(progress.cosmetics.unlocked);
  const newlyUnlocked: string[] = [];
  for (const id of earned) {
    if (!have.has(`theme:${id}`)) newlyUnlocked.push(id);
  }
  if (newlyUnlocked.length === 0) return { progress, newlyUnlocked };
  const unlocked = [...progress.cosmetics.unlocked, ...newlyUnlocked.map((id) => `theme:${id}`)];
  return {
    progress: { ...progress, cosmetics: { ...progress.cosmetics, unlocked } },
    newlyUnlocked,
  };
}
