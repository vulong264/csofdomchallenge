"use client";

/**
 * Bottom tab bar for small screens — the desktop top-nav is hidden below `sm`.
 * The page <main> reserves `pb-24` so content never hides behind this bar.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/util/cn";

const TABS = [
  { href: "/", label: "Dungeon", icon: "🗺️" },
  { href: "/bounty", label: "Bounty", icon: "💰" },
  { href: "/loot", label: "Loot", icon: "🎒" },
  { href: "/parent", label: "Parent", icon: "🔐" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-5xl">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted",
              )}
            >
              <span className="text-lg" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
