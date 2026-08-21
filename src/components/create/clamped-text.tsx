"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Where a value stops being a line and starts being a paragraph. */
const LIMIT = 50;

/**
 * Split a value into what is shown collapsed and what the pill reveals.
 *
 * Counts to `LIMIT` then backs up to the last space, so the cut never lands mid-word.
 * The tail keeps the space it was cut on, which is what makes `head + tail` the exact
 * original string — reassembling with a joiner is how a double space creeps in.
 *
 * Returns `null` when there is nothing to clamp, so the caller can skip the control
 * entirely rather than render a pill that reveals nothing.
 */
function split(text: string) {
  if (text.length <= LIMIT) return null;

  const lastSpace = text.slice(0, LIMIT).lastIndexOf(" ");
  // A single unbroken token longer than the limit — a lens name, a hex value. Cutting
  // hard is better than showing the whole thing and pretending it was under the limit.
  const cut = lastSpace > 0 ? lastSpace : LIMIT;

  return { head: text.slice(0, cut), tail: text.slice(cut) };
}

/**
 * A long field value, collapsed to one clause with a pill that opens it.
 *
 * Progressive disclosure rather than CSS truncation: the tail is genuinely absent from
 * the DOM while collapsed, so nothing is hidden behind `overflow` where a screen reader
 * would read it out anyway and a Find-in-page would land on invisible text. The button
 * carries `aria-expanded` and a spoken label, so the state and the action are available
 * without seeing the pill.
 */
export function ClampedText({
  text,
  /** What the pill is opening, for its accessible name — e.g. "Visual". */
  label,
}: {
  text: string;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const parts = split(text);

  if (!parts) return <>{text}</>;

  return (
    <>
      {parts.head}
      {expanded ? (
        // Only the revealed tail animates. Fading the whole value would re-animate the
        // clause that was already on screen, which reads as a flicker rather than as
        // something opening.
        <span className="animate-phrase-in">{parts.tail}</span>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-label={expanded ? `Show less of ${label}` : `Show all of ${label}`}
        className={cn(
          "ml-1.5 inline-flex h-4 shrink-0 items-center rounded-full px-1.5 align-middle",
          // `pb-[3px]` optically centres the periods: they sit on the baseline, so a
          // flex-centred text box still leaves them low in a pill this small.
          "pb-[3px] text-[11px] leading-none font-semibold tracking-[0.12em]",
          "ring-1 transition-colors ring-inset",
          "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
          expanded
            ? // Tinted while open, so the pill reads as pressed rather than as a second
              // "there is more" prompt on text that is already fully shown.
              "bg-brand/15 text-brand-text ring-brand/30"
            : "bg-foreground/[0.06] text-muted-foreground ring-foreground/10 hover:bg-foreground/10 hover:text-foreground",
        )}
      >
        ...
      </button>
    </>
  );
}
