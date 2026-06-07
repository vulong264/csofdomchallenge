"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

const LANES = [16, 50, 84]; // lane vertical positions (%)
type Phase = "idle" | "sending";

interface Packet {
  id: number;
  lane: number;
  dur: number;
}

const INITIAL: Packet[] = [
  { id: 1, lane: 0, dur: 1.5 },
  { id: 2, lane: 1, dur: 1.5 },
  { id: 3, lane: 2, dur: 1.5 },
  { id: 4, lane: 1, dur: 1.5 },
];

/** Packet switching: packets take different routes, arrive out of order, reassemble. */
export function PacketSwitch() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [packets, setPackets] = useState<Packet[]>(INITIAL);
  const [arrival, setArrival] = useState<number[]>([]);
  const [reassembled, setReassembled] = useState(false);

  const transmit = () => {
    setArrival([]);
    setReassembled(false);
    setPackets([1, 2, 3, 4].map((id) => ({ id, lane: Math.floor(Math.random() * 3), dur: 1.1 + Math.random() * 2 })));
    setPhase("sending");
  };
  const onArrive = (id: number) => setArrival((a) => (a.includes(id) ? a : [...a, id]));
  const allArrived = arrival.length === 4;

  return (
    <WidgetShell>
      <div className="relative h-32 overflow-hidden rounded-lg border border-border bg-surface">
        {LANES.map((t, i) => (
          <div
            key={i}
            className="absolute left-[11%] right-[13%] border-t border-dashed border-border"
            style={{ top: `${t}%` }}
          />
        ))}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 rounded bg-surface-3 px-1.5 py-6 text-[10px] text-muted">
          Send
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-surface-3 px-1.5 py-6 text-[10px] text-muted">
          Recv
        </div>
        {LANES.map((t, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-surface-2 px-1.5 py-0.5 text-[9px] text-faint"
            style={{ left: "49%", top: `${t}%` }}
          >
            R{i + 1}
          </div>
        ))}
        {packets.map((p) => (
          <motion.div
            key={p.id}
            className="absolute z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded bg-primary text-xs font-bold text-primary-fg"
            initial={false}
            animate={{ left: phase === "sending" ? "88%" : "10%", top: `${LANES[p.lane]}%` }}
            transition={{ duration: phase === "sending" ? p.dur : 0, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (phase === "sending") onArrive(p.id);
            }}
          >
            {p.id}
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={transmit}>
          Transmit 4 packets
        </Button>
        {allArrived && !reassembled ? (
          <Button size="sm" variant="outline" onClick={() => setReassembled(true)}>
            Reassemble
          </Button>
        ) : null}
      </div>

      <div className="mt-3 text-sm">
        <span className="text-xs text-faint">
          At receiver{allArrived ? (reassembled ? ", reordered:" : " — out of order!") : "…"}{" "}
        </span>
        {(reassembled ? [1, 2, 3, 4] : arrival).map((id) => (
          <span
            key={id}
            className={cn(
              "mx-0.5 inline-grid h-6 w-6 place-items-center rounded text-xs font-bold",
              reassembled ? "bg-success/20 text-success" : "bg-surface-3",
            )}
          >
            {id}
          </span>
        ))}
        {reassembled ? (
          <span className="ml-1 text-xs text-success">✓ ordered by packet number once the last arrived.</span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-faint">
        Each packet can take a different route (a router chooses) and arrive out of order. The header&apos;s packet
        number lets the receiver reassemble them.
      </p>
    </WidgetShell>
  );
}
