import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Ring geometry, in the SVG's own 120-unit box.
 *
 * The radius has to leave room for half the stroke on each side or the arc clips at the
 * viewBox edge: 52 + 12/2 = 58, inside 60. `stroke` is a prop because the small dial in
 * the sidebar needs a proportionally heavier one — 12 units on a 36px ring is a hairline
 * — but the radius stays fixed, so both rings sit on the same circle.
 */
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_STROKE = (60 - RADIUS) * 2;

/**
 * A proportion, as a dial.
 *
 * Extracted from the settings credits card so the sidebar dial cannot drift from it:
 * they are two views of one number, and two hand-rolled rings would eventually disagree
 * about their sweep direction or the colour of the unfilled remainder.
 *
 * `gradientId` is required rather than defaulted. Both rings are on screen at once — the
 * sidebar lives in the layout, the card on the settings page — and two `<defs>` sharing
 * an id is invalid markup that happens to render correctly only because the gradients
 * are identical. Exactly the kind of thing that breaks the day one of them changes.
 */
export function CreditRing({
  value,
  max,
  label,
  valueText,
  gradientId,
  className,
  stroke = 12,
  children,
}: {
  value: number;
  max: number;
  /** Accessible name for the gauge. */
  label: string;
  /** What the figure means — "1,240 of 2,000 credits remaining". */
  valueText: string;
  /** Unique per instance. See above. */
  gradientId: string;
  /** Sets the rendered size; the viewBox scales to it. */
  className?: string;
  stroke?: number;
  /** Drawn centred inside the ring. Omit for a bare dial. */
  children?: ReactNode;
}) {
  // Clamped: a top-up can legitimately push the balance past the monthly allowance, and
  // an unclamped arc would wrap back over its own start.
  const percent = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  // Guards the arc against clipping if a caller asks for a stroke the radius cannot
  // carry, rather than silently drawing a flat-sided ring.
  const width = Math.min(stroke, MAX_STROKE);

  return (
    /*
      `progressbar` on the wrapper with the SVG marked decorative, rather than labelling
      the arc itself: the arc is one of two overlapping circles and means nothing on its
      own, while the wrapper is what visually *is* the gauge. `aria-valuetext` because
      "1240" alone does not say what it counts.
    */
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      data-slot="credit-meter"
      className={cn("relative grid shrink-0 place-items-center", className)}
    >
      <svg viewBox="0 0 120 120" aria-hidden className="size-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--brand-accent)" />
          </linearGradient>
        </defs>

        {/*
          The unfilled remainder, as a low alpha of `--foreground` rather than
          `--border`. `--border` is an opaque light grey in one theme and 10% white in
          the other, so at 12px it came out as a solid grey donut on the light card while
          staying a whisper on the dark one. An alpha of the foreground flips with the
          theme and lands at the same faintness in both.
        */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="color-mix(in oklab, var(--foreground) 9%, transparent)"
          strokeWidth={width}
        />

        {/* `strokeLinecap="round"` is the whole difference between a dial and a pie
            slice — and it is why the arc must not reach a full turn, or the two round
            caps overlap into a visible lump. */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
        />
      </svg>

      {/* Absolutely centred rather than a grid child, because the SVG is rotated and a
          sibling in the same cell would inherit nothing of that but would still be
          measured against the rotated box. */}
      {children ? (
        <span className="absolute inset-0 grid place-items-center text-center">
          {children}
        </span>
      ) : null}
    </div>
  );
}
