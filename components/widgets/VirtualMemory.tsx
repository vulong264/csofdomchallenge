"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const FRAMES = 4;
const APPS = ["Browser", "Game", "Editor", "Music", "Chat", "Photos"];

/** Virtual memory: when RAM is full, the oldest page is moved to secondary storage. */
export function VirtualMemory() {
  const [ram, setRam] = useState<string[]>([]);
  const [disk, setDisk] = useState<string[]>([]);
  const [note, setNote] = useState("Open apps to fill RAM. When it's full, watch a page get swapped to disk.");

  const open = (app: string) => {
    if (ram.includes(app)) {
      setNote(`${app} is already in RAM — no paging needed.`);
      return;
    }
    setDisk((d) => d.filter((x) => x !== app));
    if (ram.length < FRAMES) {
      setRam((r) => [...r, app]);
      setNote(`Loaded ${app} into a free RAM frame.`);
    } else {
      const evicted = ram[0];
      setRam((r) => [...r.slice(1), app]);
      setDisk((d) => [...d.filter((x) => x !== evicted), evicted]);
      setNote(`RAM was full → moved ${evicted} to secondary storage (a "page out"), then loaded ${app}.`);
    }
  };

  return (
    <WidgetShell>
      <div className="flex flex-wrap gap-2">
        {APPS.map((a) => (
          <Button key={a} size="sm" variant="outline" onClick={() => open(a)}>
            Open {a}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-faint">RAM ({FRAMES} frames)</div>
          <div className="grid gap-1.5">
            {Array.from({ length: FRAMES }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "grid h-9 place-items-center rounded-lg border text-sm",
                  ram[i] ? "border-primary/50 bg-primary/10 text-text" : "border-dashed border-border text-faint",
                )}
              >
                {ram[i] ?? "empty"}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-faint">Secondary storage (paged out)</div>
          <div className="grid gap-1.5">
            {disk.length === 0 ? (
              <div className="grid h-9 place-items-center rounded-lg border border-dashed border-border text-sm text-faint">
                empty
              </div>
            ) : (
              disk.map((d) => (
                <div key={d} className="grid h-9 place-items-center rounded-lg border border-border bg-surface text-sm text-muted">
                  {d}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">{note}</p>
    </WidgetShell>
  );
}
