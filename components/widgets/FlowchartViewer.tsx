"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LabeledInput } from "./parts";
import { WidgetShell } from "./parts";

type NodeId = "start" | "input" | "decision" | "yes" | "no" | "stop";

function Node({
  shape,
  cx,
  cy,
  w,
  h,
  label,
  active,
}: {
  shape: "terminator" | "io" | "process" | "decision";
  cx: number;
  cy: number;
  w: number;
  h: number;
  label: string;
  active: boolean;
}) {
  const fill = active ? "var(--color-success)" : "var(--color-surface-2)";
  const stroke = active ? "var(--color-success)" : "var(--color-border-strong)";
  const text = active ? "#0a0a0f" : "var(--color-text)";
  const x = cx - w / 2;
  const y = cy - h / 2;
  let shapeEl;
  if (shape === "terminator") shapeEl = <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} />;
  else if (shape === "process") shapeEl = <rect x={x} y={y} width={w} height={h} rx={4} fill={fill} stroke={stroke} />;
  else if (shape === "io")
    shapeEl = (
      <polygon
        points={`${x + 12},${y} ${x + w},${y} ${x + w - 12},${y + h} ${x},${y + h}`}
        fill={fill}
        stroke={stroke}
      />
    );
  else
    shapeEl = (
      <polygon points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`} fill={fill} stroke={stroke} />
    );
  return (
    <g>
      {shapeEl}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={11} fill={text}>
        {label}
      </text>
    </g>
  );
}

export function FlowchartViewer() {
  const [n, setN] = useState("7");
  const [ran, setRan] = useState(false);
  const val = Number(n);
  const positive = val > 0;
  const on = (id: NodeId): boolean => {
    if (!ran) return false;
    if (id === "start" || id === "input" || id === "decision" || id === "stop") return true;
    if (id === "yes") return positive;
    if (id === "no") return !positive;
    return false;
  };
  const lineStroke = "var(--color-border-strong)";

  return (
    <WidgetShell>
      <svg viewBox="0 0 320 330" className="w-full">
        {/* connectors */}
        <g stroke={lineStroke} strokeWidth={1.5} fill="none">
          <line x1={160} y1={40} x2={160} y2={60} />
          <line x1={160} y1={96} x2={160} y2={114} />
          <line x1={120} y1={150} x2={78} y2={196} />
          <line x1={200} y1={150} x2={242} y2={196} />
          <line x1={78} y1={238} x2={78} y2={300} />
          <line x1={78} y1={300} x2={140} y2={300} />
          <line x1={242} y1={238} x2={242} y2={300} />
          <line x1={242} y1={300} x2={180} y2={300} />
        </g>
        <text x={104} y={172} fontSize={10} fill="var(--color-success)">
          Yes
        </text>
        <text x={210} y={172} fontSize={10} fill="var(--color-danger)">
          No
        </text>

        <Node shape="terminator" cx={160} cy={26} w={84} h={28} label="Start" active={on("start")} />
        <Node shape="io" cx={160} cy={82} w={120} h={30} label="INPUT n" active={on("input")} />
        <Node shape="decision" cx={160} cy={150} w={120} h={64} label="n > 0 ?" active={on("decision")} />
        <Node shape="io" cx={78} cy={218} w={120} h={32} label="Positive" active={on("yes")} />
        <Node shape="io" cx={242} cy={218} w={120} h={32} label="Not positive" active={on("no")} />
        <Node shape="terminator" cx={160} cy={304} w={84} h={28} label="Stop" active={on("stop")} />
      </svg>

      <div className="mt-2 flex items-end gap-2">
        <div className="w-28">
          <LabeledInput label="Input n" value={n} onChange={(v) => { setN(v); setRan(false); }} />
        </div>
        <Button size="sm" onClick={() => setRan(true)}>
          Run
        </Button>
        {ran ? (
          <span className="pb-2 text-sm text-muted">
            Output: <span className="font-medium text-success">{positive ? "Positive" : "Not positive"}</span>
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-faint">
        Terminator (Start/Stop), parallelogram (input/output), diamond (decision). Run it to light up the path.
      </p>
    </WidgetShell>
  );
}
