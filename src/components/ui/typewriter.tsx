"use client";

import { useEffect, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Types `text` out one character at a time on mount.
 *
 * Three things this has to get right:
 *
 * - **No layout shift, vertical or horizontal.** A full, `invisible` copy sits in
 *   the same grid cell and holds the final box, so nothing below the greeting
 *   moves while it types — and the reveal is left-aligned inside that box, because
 *   centring a growing string nudges every character already on screen half a
 *   glyph sideways per keystroke.
 *
 *   That box has to be **the width of the text**, not of the container, which is
 *   what `w-fit mx-auto` is for. Left-aligned inside a full-width box, the growing
 *   line starts at the page margin and snaps to the middle on the last keystroke —
 *   a jump proportional to the slack. It was invisible on the home page, whose
 *   column is about as wide as the line, and glaring on `/new`, where the same
 *   greeting spans a 1464px viewport.
 * - **Assistive tech gets the whole line immediately.** The visual copy is
 *   `aria-hidden` and a `sr-only` copy carries the text, so nothing is announced
 *   letter by letter.
 * - **`prefers-reduced-motion` skips it.** Not a shorter animation — none.
 *
 * State lives inside, so a parent re-render (typing in the composer, say) never
 * restarts it.
 */
export function Typewriter({
  text,
  className,
  speedMs = 34,
  startDelayMs = 260,
}: {
  text: string;
  className?: string;
  /** Per character. */
  speedMs?: number;
  /** Beat before the first character, so the page settles first. */
  startDelayMs?: number;
}) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    let timer: number;
    let index = 0;

    // A chain of timeouts rather than an interval: each tick schedules the
    // next, so a slow frame delays the run instead of stacking up callbacks.
    const tick = () => {
      index += 1;
      setTyped(index);
      if (index < text.length) timer = window.setTimeout(tick, speedMs);
    };

    timer = window.setTimeout(tick, startDelayMs);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, text, speedMs, startDelayMs]);

  const done = reduceMotion || typed >= text.length;
  const visible = reduceMotion ? text : text.slice(0, typed);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>

      {/* `w-fit` sizes the cell to the full line and `mx-auto` centres that cell, so
          a left-aligned reveal grows from exactly where the finished line starts.
          Wrapping still centres its lines — `fit-content` caps at the available
          width, and `text-left` is dropped once typing ends. */}
      <span aria-hidden className="mx-auto grid w-fit">
        {/* `invisible`, not `opacity-0`: visibility:hidden also keeps this copy
            out of the accessibility tree, so the line is not duplicated. */}
        <span className="invisible col-start-1 row-start-1">{text}</span>

        <span
          // Stable hook for tests: the surrounding spans all carry the same
          // text, so an index or a text match would be ambiguous.
          data-slot="typewriter-reveal"
          className={cn("col-start-1 row-start-1", !done && "text-left")}
        >
          {visible}
          {done ? null : (
            <span
              className="caret-blink ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-current align-middle"
              // The caret is a cursor, not content — never part of the line.
              aria-hidden
            />
          )}
        </span>
      </span>
    </span>
  );
}
