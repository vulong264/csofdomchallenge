import { Fragment } from "react";

type Token = { kind: "plain" | "bold" | "code"; text: string };

/** Minimal inline markdown: **bold** and `code`. No dependency needed. */
function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "plain", text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) out.push({ kind: "bold", text: tok.slice(2, -2) });
    else out.push({ kind: "code", text: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ kind: "plain", text: text.slice(last) });
  return out;
}

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {tokenize(text).map((t, i) => {
        if (t.kind === "bold") {
          return (
            <strong key={i} className="font-semibold text-text">
              {t.text}
            </strong>
          );
        }
        if (t.kind === "code") {
          return (
            <code key={i} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
              {t.text}
            </code>
          );
        }
        return <Fragment key={i}>{t.text}</Fragment>;
      })}
    </>
  );
}
