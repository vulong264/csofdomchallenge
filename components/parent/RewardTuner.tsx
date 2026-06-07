"use client";

/**
 * In-app tuning of the reward economy (spec §11 — "a parent can re-tune every
 * dial without code changes"). Edits a working copy of the resolved RewardConfig
 * and persists it as `rewardConfigOverride`, deep-merged over the code defaults.
 * Reset clears the override so the app falls back to lib/rewards/config.ts.
 */
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEFAULT_REWARD_CONFIG } from "@/lib/rewards/config";
import type { RewardConfig } from "@/lib/rewards/types";
import { useProgress } from "@/lib/progress/context";
import { formatVND } from "@/lib/util/format";

function NumberField({
  label,
  value,
  suffix,
  step = 1000,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  step?: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-right font-mono tabular-nums outline-none focus:border-primary"
        />
        {suffix ? <span className="shrink-0 text-xs text-faint">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function RewardTuner() {
  const { config, progress, update } = useProgress();
  const [draft, setDraft] = useState<RewardConfig>(config);
  const [saved, setSaved] = useState(false);
  const isOverridden = progress.rewardConfigOverride !== undefined;

  const set = (patch: (c: RewardConfig) => RewardConfig) => {
    setSaved(false);
    setDraft((d) => patch(d));
  };

  const save = () => {
    update((p) => ({ ...p, rewardConfigOverride: draft }));
    setSaved(true);
  };
  const reset = () => {
    update((p) => ({ ...p, rewardConfigOverride: undefined }));
    setDraft(DEFAULT_REWARD_CONFIG);
    setSaved(false);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Every payout dial. Changes apply instantly across the dashboard &amp; Bounty Board.</p>
        {isOverridden ? <Badge tone="warn">Custom</Badge> : <Badge tone="muted">Defaults</Badge>}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Mastery cash</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Per sector cleared"
            value={draft.mastery.perSectorVND}
            suffix={formatVND(draft.mastery.perSectorVND)}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, mastery: { ...c.mastery, perSectorVND: n } }))}
          />
          <NumberField
            label="Flawless bonus"
            value={draft.mastery.flawlessBonusVND}
            suffix={formatVND(draft.mastery.flawlessBonusVND)}
            step={5_000}
            onChange={(n) => set((c) => ({ ...c, mastery: { ...c.mastery, flawlessBonusVND: n } }))}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Speed vault (finish-early bonus)</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label={`By week ${draft.weeks.fullVaultEndWeek}`}
            value={draft.speedVault.week4VND}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, speedVault: { ...c.speedVault, week4VND: n } }))}
          />
          <NumberField
            label={`By week ${draft.weeks.targetEndWeek}`}
            value={draft.speedVault.week5VND}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, speedVault: { ...c.speedVault, week5VND: n } }))}
          />
          <NumberField
            label={`By week ${draft.weeks.deadlineWeek}`}
            value={draft.speedVault.week6VND}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, speedVault: { ...c.speedVault, week6VND: n } }))}
          />
          <NumberField
            label="Penalty / extra week"
            value={draft.speedVault.postWeek6PenaltyPerWeekVND}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, speedVault: { ...c.speedVault, postWeek6PenaltyPerWeekVND: n } }))}
          />
          <NumberField
            label="Max penalty"
            value={draft.speedVault.postWeek6PenaltyCapVND}
            step={10_000}
            onChange={(n) => set((c) => ({ ...c, speedVault: { ...c.speedVault, postWeek6PenaltyCapVND: n } }))}
          />
          <NumberField
            label="Total payout cap"
            value={draft.totalCapVND}
            step={50_000}
            onChange={(n) => set((c) => ({ ...c, totalCapVND: n }))}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Week thresholds</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Full-vault end week"
            value={draft.weeks.fullVaultEndWeek}
            suffix="wk"
            step={1}
            min={1}
            onChange={(n) => set((c) => ({ ...c, weeks: { ...c.weeks, fullVaultEndWeek: n } }))}
          />
          <NumberField
            label="Target end week"
            value={draft.weeks.targetEndWeek}
            suffix="wk"
            step={1}
            min={1}
            onChange={(n) => set((c) => ({ ...c, weeks: { ...c.weeks, targetEndWeek: n } }))}
          />
          <NumberField
            label="Deadline week"
            value={draft.weeks.deadlineWeek}
            suffix="wk"
            step={1}
            min={1}
            onChange={(n) => set((c) => ({ ...c, weeks: { ...c.weeks, deadlineWeek: n } }))}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Nintendo minutes</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Daily session"
            value={draft.nintendo.dailySessionMin}
            suffix="min"
            step={5}
            onChange={(n) => set((c) => ({ ...c, nintendo: { ...c.nintendo, dailySessionMin: n } }))}
          />
          <NumberField
            label="Weekly-active bonus"
            value={draft.nintendo.weeklyActiveBonusMin}
            suffix="min"
            step={5}
            onChange={(n) => set((c) => ({ ...c, nintendo: { ...c.nintendo, weeklyActiveBonusMin: n } }))}
          />
          <NumberField
            label="Active-days threshold"
            value={draft.nintendo.weeklyActiveThreshold}
            suffix="days"
            step={1}
            min={1}
            onChange={(n) => set((c) => ({ ...c, nintendo: { ...c.nintendo, weeklyActiveThreshold: n } }))}
          />
          <NumberField
            label="Sector clear"
            value={draft.nintendo.sectorClearMin}
            suffix="min"
            step={10}
            onChange={(n) => set((c) => ({ ...c, nintendo: { ...c.nintendo, sectorClearMin: n } }))}
          />
          <NumberField
            label="Dungeon clear"
            value={draft.nintendo.dungeonClearMin}
            suffix="min"
            step={30}
            onChange={(n) => set((c) => ({ ...c, nintendo: { ...c.nintendo, dungeonClearMin: n } }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={!dirty}>
          Save changes
        </Button>
        <Button variant="ghost" onClick={reset} disabled={!isOverridden && !dirty}>
          Reset to defaults
        </Button>
        {saved && !dirty ? <span className="text-sm text-success">Saved ✓</span> : null}
      </div>
    </div>
  );
}
