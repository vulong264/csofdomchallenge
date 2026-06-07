"use client";

import { useState } from "react";
import { cn } from "@/lib/util/cn";
import { WidgetShell } from "./parts";

type Mode = "symmetric" | "asymmetric";

// Illustrative only — a Caesar shift to *show* scrambling, not real crypto.
const shift = (s: string, n: number) =>
  s
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26) + 65));

function KeyChip({ label, tone }: { label: string; tone: "shared" | "public" | "private" }) {
  const styles = {
    shared: "bg-accent/15 text-accent",
    public: "bg-xp/15 text-xp",
    private: "bg-success/15 text-success",
  } as const;
  const icon = { shared: "🔑", public: "🔓", private: "🔐" } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", styles[tone])}>
      {icon[tone]} {label}
    </span>
  );
}

/** Symmetric vs asymmetric encryption — which key encrypts, which decrypts. */
export function EncryptionKeys() {
  const [mode, setMode] = useState<Mode>("symmetric");
  const [msg, setMsg] = useState("ATTACK AT DAWN");
  const cipher = shift(msg, 7);

  return (
    <WidgetShell>
      <div className="mb-3 flex items-center justify-center gap-2">
        {(["symmetric", "asymmetric"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium capitalize",
              m === mode ? "bg-primary text-primary-fg" : "bg-surface-3 text-muted hover:text-text",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        spellCheck={false}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-center font-mono text-sm outline-none focus:border-primary"
      />

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[10px] uppercase tracking-wide text-faint">Sender encrypts with</div>
          <div className="mt-1">
            {mode === "symmetric" ? (
              <KeyChip label="Shared secret key" tone="shared" />
            ) : (
              <KeyChip label="Recipient's PUBLIC key" tone="public" />
            )}
          </div>
        </div>
        <div className="text-muted">→</div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[10px] uppercase tracking-wide text-faint">Receiver decrypts with</div>
          <div className="mt-1">
            {mode === "symmetric" ? (
              <KeyChip label="Same shared key" tone="shared" />
            ) : (
              <KeyChip label="Recipient's PRIVATE key" tone="private" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-surface p-3 text-center font-mono text-sm">
        <span className="text-text/80">{msg.toUpperCase() || "…"}</span>
        <span className="mx-2 text-faint">🔒</span>
        <span className="text-danger">{cipher || "…"}</span>
        <span className="mx-2 text-faint">🔓</span>
        <span className="text-success">{msg.toUpperCase() || "…"}</span>
      </div>

      <p className="mt-3 text-center text-xs text-faint">
        {mode === "symmetric"
          ? "Symmetric: the SAME secret key encrypts and decrypts — both sides must share it."
          : "Asymmetric: a PUBLIC key encrypts; only the matching PRIVATE key can decrypt. The private key is never shared."}
      </p>
    </WidgetShell>
  );
}
