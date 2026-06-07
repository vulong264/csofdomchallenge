"use client";

import type { ComponentType } from "react";
import type { WidgetId } from "@/content/types";
import { BaseConverter } from "./BaseConverter";
import { BinaryAdder } from "./BinaryAdder";
import { BinaryShifter } from "./BinaryShifter";
import { CheckDigit } from "./CheckDigit";
import { ClassifyDrill } from "./ClassifyDrill";
import { EncryptionKeys } from "./EncryptionKeys";
import { FdeCycle } from "./FdeCycle";
import { FlowchartViewer } from "./FlowchartViewer";
import { LogicPlayground } from "./LogicPlayground";
import { PacketSwitch } from "./PacketSwitch";
import { ParityCalc } from "./ParityCalc";
import { PixelBuilder } from "./PixelBuilder";
import { PseudocodeRunner } from "./PseudocodeRunner";
import { RamRomSort } from "./RamRomSort";
import { SensorMatch } from "./SensorMatch";
import { SortSearchVisualiser } from "./SortSearchVisualiser";
import { TraceTable } from "./TraceTable";
import { TruthTableFill } from "./TruthTableFill";
import { VirtualMemory } from "./VirtualMemory";
import { VonNeumann } from "./VonNeumann";
import { SoundSampler } from "./SoundSampler";
import { TourDemo } from "./TourDemo";
import { TwosComplement } from "./TwosComplement";

/**
 * Maps a WidgetId to its interactive component. Widgets are added per build
 * step; anything not yet registered renders a graceful placeholder, so content
 * can reference future widgets without breaking.
 */
export const WIDGET_REGISTRY: Partial<Record<WidgetId, ComponentType>> = {
  "tour-demo": TourDemo,
  // Sector 1 — Data Representation
  "base-converter": BaseConverter,
  "twos-complement": TwosComplement,
  "binary-adder": BinaryAdder,
  "binary-shifter": BinaryShifter,
  "pixel-builder": PixelBuilder,
  "sound-sampler": SoundSampler,
  // Sector 2 — Data Transmission
  "packet-switch": PacketSwitch,
  "parity-calc": ParityCalc,
  "check-digit": CheckDigit,
  "encryption-keys": EncryptionKeys,
  // Sector 3 — Hardware
  "fde-cycle": FdeCycle,
  "von-neumann-builder": VonNeumann,
  "sensor-match": SensorMatch,
  "ram-rom-sort": RamRomSort,
  "virtual-memory": VirtualMemory,
  // Sector 4 — Boolean Logic
  "logic-playground": LogicPlayground,
  "truth-table-fill": TruthTableFill,
  // Sector 5 — Algorithms
  "pseudocode-runner": PseudocodeRunner,
  "trace-table": TraceTable,
  "sort-search-visualiser": SortSearchVisualiser,
  "classify-drill": ClassifyDrill,
  "flowchart-builder": FlowchartViewer,
};

function WidgetPlaceholder({ id }: { id: WidgetId }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-4 text-center text-sm text-muted">
      <span className="font-mono text-xs text-faint">{id}</span>
      <p className="mt-1">Interactive widget arrives in a later build step.</p>
    </div>
  );
}

export function WidgetMount({ widget }: { widget: WidgetId }) {
  const Component = WIDGET_REGISTRY[widget];
  if (!Component) return <WidgetPlaceholder id={widget} />;
  return <Component />;
}
