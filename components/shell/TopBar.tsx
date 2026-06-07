"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { levelProgress } from "@/lib/engine/xp";
import { streakAlive } from "@/lib/engine/streak";
import { useProgress } from "@/lib/progress/context";
import { cn } from "@/lib/util/cn";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      {label}
    </Link>
  );
}

export function TopBar() {
  const { progress, ready, today } = useProgress();
  const lp = levelProgress(progress.xp);
  const alive = ready && streakAlive(progress.streak, today);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="text-lg">
            💀
          </span>
          <span>CS of Doom</span>
        </Link>
        <nav className="ml-1 hidden gap-1 sm:flex">
          <NavLink href="/" label="Dungeon" />
          <NavLink href="/bounty" label="Bounty" />
          <NavLink href="/loot" label="Loot" />
          <NavLink href="/parent" label="Parent" />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex" title={`${lp.intoLevel}/${lp.span} XP to next level`}>
            <span className="text-xs font-medium text-muted">Lv {lp.level}</span>
            <ProgressBar value={lp.pct} className="w-20" barClassName="bg-xp" />
          </div>
          <Badge tone={alive ? "accent" : "muted"}>🔥 {ready ? progress.streak.current : 0}d</Badge>
        </div>
      </div>
    </header>
  );
}
