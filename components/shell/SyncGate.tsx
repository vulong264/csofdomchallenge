"use client";

/**
 * Access-code gate for cross-device sync. Appears once per device when the
 * server has sync configured but this browser hasn't supplied a valid family
 * code yet. Entering the code links the device to the shared progress; the
 * learner can also dismiss it and keep using the device standalone.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useProgress } from "@/lib/progress/context";

export function SyncGate() {
  const { syncState, submitAccessCode, dismissSync } = useProgress();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = syncState === "needs-code";

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(false);
    const ok = await submitAccessCode(code.trim());
    setBusy(false);
    if (ok) setCode("");
    else setError(true);
  };

  return (
    <Modal open={open} onClose={dismissSync} title="Sync this device">
      <p className="text-sm text-muted">
        Enter the family access code to share progress across this learner&apos;s devices and the parent
        dashboard. You only need to do this once per device.
      </p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
        }}
        placeholder="Access code"
        className="mt-4 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-border-strong"
      />
      {error ? <p className="mt-2 text-sm text-danger">That code didn&apos;t work — try again.</p> : null}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismissSync} disabled={busy}>
          Use this device only
        </Button>
        <Button size="sm" onClick={() => void submit()} disabled={busy || !code.trim()}>
          {busy ? "Linking…" : "Link device"}
        </Button>
      </div>
    </Modal>
  );
}
