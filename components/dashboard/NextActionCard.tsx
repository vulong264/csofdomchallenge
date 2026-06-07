"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UNITS } from "@/content/index";
import { recommendNext } from "@/lib/engine/recommend";
import { useProgress } from "@/lib/progress/context";

const ICON: Record<string, string> = { learn: "📖", boss: "⚔️", review: "🔁", done: "🏁" };
const CTA: Record<string, string> = {
  learn: "Start learning",
  boss: "Face the boss",
  review: "Do warm-ups",
  done: "Open",
};

export function NextActionCard() {
  const { progress, today } = useProgress();
  const action = recommendNext(UNITS, progress, today);
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="text-3xl" aria-hidden>
          {ICON[action.kind] ?? "▶"}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-faint">Next up</p>
          <h2 className="mt-1 text-xl font-semibold">{action.label}</h2>
          <p className="mt-1 text-sm text-muted">{action.reason}</p>
        </div>
      </div>
      <div className="relative mt-5">
        <Link href={action.href}>
          <Button size="lg">{CTA[action.kind] ?? "Open"}</Button>
        </Link>
      </div>
    </Card>
  );
}
