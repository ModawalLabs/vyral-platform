"use client";

import { Check, Copy, Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Whether an element is showing less than it holds.
 *
 * `line-clamp` reports nothing about whether it actually clamped, and the answer depends
 * on the rendered width — a prompt that fits in four lines on a wide panel needs six on
 * a narrow one. So this is measured rather than guessed from the character count: a
 * length threshold was a guess about font metrics, and the seeded data has a prompt
 * sitting within a line of it either way.
 *
 * A `ResizeObserver` because the panel is responsive. It fires once on `observe()`, which
 * covers the initial measurement, and again on every reflow — including the one caused by
 * expanding, which is why the check is skipped while expanded.
 */
function useOverflowing(expanded: boolean) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || expanded) return;

    // Inside the observer's callback, not the effect body: setState called
    // synchronously while an effect runs is a cascading render, and the lint rule that
    // forbids it is right.
    const observer = new ResizeObserver(() => {
      setOverflowing(node.scrollHeight > node.clientHeight + 1);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded]);

  return { ref, overflowing };
}

/**
 * The brief something was generated from.
 *
 * Shared by the export detail page and the preview dialog. Everything around it on both
 * surfaces is *what* was produced; this is the only thing that says *why*, and it is the
 * answer to the question neither page could otherwise answer — "how do I make another
 * one like this".
 *
 * Clamped rather than shown in full. On the export page the panel's height is matched to
 * the video stage beside it, and a four-hundred-character brief rendered whole pushes it
 * past that and knocks the two columns' bottom edges out of line; in a dialog it would
 * push the action below the fold. Clamping holds both, and expanding is a deliberate act
 * that is allowed to grow the container.
 *
 * A copy button, because a prompt is a thing you reuse. Displaying it read-only and
 * making the reader select four lines of clamped text by hand would be showing it
 * without actually handing it over.
 */
export function PromptBlock({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { ref, overflowing } = useOverflowing(expanded);

  /*
   * `navigator.clipboard` can reject — an insecure origin, a denied permission, a
   * browser that never granted it. Caught rather than left to become an unhandled
   * rejection in the console; the tick simply does not appear, which is the honest
   * outcome of a copy that did not happen.
   */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div data-slot="prompt-block" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <Quote aria-hidden className="size-3" />
          Prompt
        </span>

        <button
          type="button"
          onClick={copy}
          // The name changes with the state, so a screen reader hears the confirmation
          // rather than only seeing the tick.
          aria-label={copied ? "Prompt copied" : "Copy prompt"}
          title={copied ? "Copied" : "Copy prompt"}
          className={cn(
            "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            copied
              ? "text-success"
              : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          {copied ? (
            <Check aria-hidden className="size-3" strokeWidth={3} />
          ) : (
            <Copy aria-hidden className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/*
        A quoted plate with a brand-tinted left rule. The prompt is the only thing in
        this panel that is someone's own words rather than a system value, and the rule
        is what says so — without it, four lines of prose read as another `dd` that
        happens to have overflowed.
      */}
      <div className="rounded-lg border-l-2 border-brand/40 bg-foreground/[0.03] py-2.5 pr-3 pl-3">
        <p
          ref={ref}
          data-slot="prompt-text"
          data-expanded={expanded ? "" : undefined}
          className={cn(
            "text-xs leading-relaxed text-muted-foreground",
            // `line-clamp` and not a max-height: the fold has to land between lines, and
            // a pixel height cannot know the line height it is cutting through.
            // Written out, not interpolated: Tailwind scans source text, so a computed
            // `line-clamp-${n}` compiles to no CSS at all and the clamp silently does
            // nothing.
            !expanded && "line-clamp-4",
          )}
        >
          {prompt}
        </p>
      </div>

      {/* Offered only when there is genuinely something behind the fold — see
          `useOverflowing`. Once expanded it has to stay, or there would be no way back. */}
      {overflowing || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="self-start rounded px-0.5 text-[11px] font-medium text-brand-text transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
        >
          {expanded ? "Show less" : "Show full prompt"}
        </button>
      ) : null}
    </div>
  );
}
