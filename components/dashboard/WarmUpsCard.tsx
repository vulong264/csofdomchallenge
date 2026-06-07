"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { dueReviewCount } from "@/lib/engine/recommend";
import { useProgress } from "@/lib/progress/context";

export function WarmUpsCard() {
  const { progress, today } = useProgress();
  const due = dueReviewCount(progress, today);
  if (due === 0) return null;
  return (
    <Card className="flex items-center gap-4 border-xp/30 bg-xp/5 p-4">
      <div className="text-2xl" aria-hidden>
        🔁
      </div>
      <div className="flex-1">
        <p className="font-semibold">
          {due} warm-up{due > 1 ? "s" : ""} due
        </p>
        <p className="text-xs text-muted">Patrols from cleared sectors — clear them to hold your Rank.</p>
      </div>
      <Link href="/warmups">
        <Button variant="outline">Review</Button>
      </Link>
    </Card>
  );
}
