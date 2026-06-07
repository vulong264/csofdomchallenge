"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shell/StatusBadge";
import { Card } from "@/components/ui/Card";
import { UNITS } from "@/content/index";
import { unitStatuses } from "@/lib/engine/gating";
import { useProgress } from "@/lib/progress/context";
import { cn } from "@/lib/util/cn";

export function SectorMap() {
  const { progress } = useProgress();
  const views = unitStatuses(UNITS, progress);

  return (
    <div className="grid gap-2">
      {views.map((v) => {
        const locked = v.status === "locked";
        const card = (
          <Card
            className={cn(
              "flex items-center gap-4 p-4",
              locked ? "opacity-60" : "transition-colors hover:border-border-strong",
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-3 font-bold tabular-nums">
              {v.unit.sector.number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{v.unit.title}</span>
                {v.flawlessAchieved ? (
                  <span title="Flawless" aria-label="Flawless">
                    ⭐
                  </span>
                ) : null}
                {!v.unit.isRewardSector ? <span className="text-xs text-faint">· tutorial</span> : null}
              </div>
              <p className="truncate text-xs text-muted">
                Boss: {v.unit.sector.boss}
                {v.bestPercent > 0 ? ` · best ${v.bestPercent}%` : ""}
              </p>
            </div>
            <StatusBadge status={v.status} />
          </Card>
        );
        return locked ? (
          <div key={v.unit.id}>{card}</div>
        ) : (
          <Link key={v.unit.id} href={`/unit/${v.unit.id}`} className="block">
            {card}
          </Link>
        );
      })}
    </div>
  );
}
