"use client";

import type { ContentBlock } from "@/content/types";
import { cn } from "@/lib/util/cn";
import { WidgetMount } from "@/components/widgets/registry";
import { InlineText } from "./InlineText";

const calloutStyle: Record<string, { box: string; title: string; icon: string }> = {
  info: { box: "border-primary/30 bg-primary/10", title: "text-primary", icon: "💡" },
  key: { box: "border-accent/40 bg-accent/10", title: "text-accent", icon: "🔑" },
  warn: { box: "border-warn/40 bg-warn/10", title: "text-warn", icon: "⚠️" },
  mistake: { box: "border-danger/40 bg-danger/10", title: "text-danger", icon: "🚫" },
};

function Block({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="leading-relaxed text-text/90">
          <InlineText text={block.text} />
        </p>
      );
    case "h":
      return <h3 className="mt-2 text-lg font-semibold">{block.text}</h3>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={cn("grid gap-1.5 pl-5", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((it, i) => (
            <li key={i} className="leading-relaxed text-text/90 marker:text-faint">
              <InlineText text={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case "callout": {
      const s = calloutStyle[block.tone];
      return (
        <div className={cn("rounded-lg border p-3 text-sm", s.box)}>
          {block.title ? (
            <div className={cn("mb-1 font-semibold", s.title)}>
              {s.icon} {block.title}
            </div>
          ) : null}
          <p className="leading-relaxed text-text/90">
            <InlineText text={block.text} />
          </p>
        </div>
      );
    }
    case "code":
      return (
        <figure>
          <pre className="overflow-x-auto rounded-lg border border-border bg-[#0c0c15] p-4 font-mono text-sm leading-relaxed">
            <code>{block.lines.join("\n")}</code>
          </pre>
          {block.caption ? <figcaption className="mt-1 text-xs text-muted">{block.caption}</figcaption> : null}
        </figure>
      );
    case "kv":
      return (
        <div className="grid gap-1">
          {block.rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-1.5 text-sm">
              <span className="min-w-10 font-mono font-semibold text-accent">{r.k}</span>
              <span className="text-muted">{r.v}</span>
            </div>
          ))}
        </div>
      );
    case "widget":
      return (
        <figure>
          <WidgetMount widget={block.widget} />
          {block.caption ? (
            <figcaption className="mt-1 text-center text-xs text-muted">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    default:
      return null;
  }
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="grid gap-3">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}
