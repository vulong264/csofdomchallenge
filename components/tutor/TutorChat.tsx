"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AiError, streamTutor } from "@/lib/ai/client";
import type { TutorMessage } from "@/lib/ai/types";
import type { Unit } from "@/content/types";
import { cn } from "@/lib/util/cn";

const STARTERS = [
  "I'm stuck — can you give me a hint?",
  "Explain this sector simply.",
  "Quiz me on one tricky idea.",
  "What mistakes do people make here?",
];

export function TutorChat({ unit, available }: { unit: Unit; available: boolean }) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setError(null);
    setInput("");

    const history: TutorMessage[] = [...messages, { role: "user", content: trimmed }];
    // Append the user turn + an empty assistant turn we stream into.
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const dropEmptyPlaceholder = () =>
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
        return prev;
      });

    try {
      const full = await streamTutor(
        { unitId: unit.id, messages: history },
        (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        },
        controller.signal,
      );
      // Defensive: a 200 with no text (shouldn't happen now the server surfaces
      // upstream errors, but guard so the bubble is never silently empty).
      if (!full.trim()) {
        setError("The tutor didn't respond — try again in a moment.");
        dropEmptyPlaceholder();
      }
    } catch (e) {
      const msg =
        e instanceof AiError && e.reason === "unavailable"
          ? "The tutor isn't configured right now."
          : e instanceof AiError && e.reason === "rate_limited"
            ? e.message
            : "The tutor is unavailable right now — try again in a moment.";
      setError(msg);
      dropEmptyPlaceholder();
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  if (!available) {
    return (
      <Card className="p-6">
        <div className="text-3xl" aria-hidden>
          🧠
        </div>
        <p className="mt-2 font-semibold">The AI tutor is offline</p>
        <p className="mt-1 text-sm text-muted">
          No <code className="rounded bg-surface-2 px-1">GEMINI_API_KEY</code> is configured, so the live tutor is
          unavailable. Here&apos;s what this sector covers in the meantime:
        </p>
        <p className="mt-3 rounded-lg border border-border bg-surface-2 p-3 text-sm text-text/80">
          {unit.tutor.conceptSummary}
        </p>
        {unit.tutor.misconceptions.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide text-faint">Watch out for</p>
            <ul className="mt-1 grid gap-1 text-sm text-muted">
              {unit.tutor.misconceptions.map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="flex h-[28rem] flex-col p-0">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="text-3xl" aria-hidden>
                🧠
              </div>
              <p className="mt-2 text-sm text-muted">
                Hey Tom — ask me anything about <span className="font-medium text-text">{unit.title}</span>. I give
                hints, not boss answers.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  m.role === "user" ? "bg-primary text-primary-fg" : "border border-border bg-surface-2 text-text",
                )}
              >
                {m.content || (streaming && i === messages.length - 1 ? <span className="text-muted">…</span> : "")}
              </div>
            </div>
          ))
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-text"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="px-4 pb-1 text-xs text-danger">{error}</p> : null}

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          rows={1}
          disabled={streaming}
          placeholder="Ask the tutor…"
          className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <Button type="submit" disabled={streaming || input.trim().length === 0}>
          {streaming ? "…" : "Send"}
        </Button>
      </form>
    </Card>
  );
}
