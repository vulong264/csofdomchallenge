"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useProgress } from "@/lib/progress/context";

export function DataControls() {
  const { progress, today, exportJSON, importJSON, reset } = useProgress();
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const onExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cs-of-doom-${progress.learnerName}-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (json: string) => {
    try {
      importJSON(json);
      setImported(true);
      setError(null);
      setText("");
      setTimeout(() => {
        setImportOpen(false);
        setImported(false);
      }, 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => doImport(String(reader.result));
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExport}>
        Export progress
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setImported(false);
          setImportOpen(true);
        }}
      >
        Import
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
        Reset…
      </Button>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import progress">
        <p className="text-sm text-muted">Choose a previously exported file, or paste its JSON below.</p>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-text"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="…or paste JSON here"
          className="mt-3 w-full rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs outline-none focus:border-primary"
        />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {imported ? <p className="mt-2 text-sm text-success">Imported ✓</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setImportOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => doImport(text)} disabled={!text.trim()}>
            Import JSON
          </Button>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all progress?">
        <p className="text-sm text-muted">
          This wipes XP, streaks, mastery and the reward ledger for {progress.learnerName}. Export first if you want a
          backup — this can&apos;t be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              reset();
              setResetOpen(false);
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
