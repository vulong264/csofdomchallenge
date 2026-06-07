import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { UnitStatus } from "@/lib/progress/types";

const map: Record<UnitStatus, { tone: BadgeTone; label: string; icon: string }> = {
  locked: { tone: "muted", label: "Locked", icon: "🔒" },
  available: { tone: "primary", label: "Ready", icon: "⚔️" },
  "in-progress": { tone: "xp", label: "In progress", icon: "⏳" },
  mastered: { tone: "success", label: "Mastered", icon: "✓" },
};

export function StatusBadge({ status }: { status: UnitStatus }) {
  const m = map[status];
  return (
    <Badge tone={m.tone}>
      {m.icon} {m.label}
    </Badge>
  );
}
