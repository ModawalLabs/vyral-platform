"use client";

import { useState } from "react";

import {
  periodMeta,
  usdFor,
  type Period,
  type SpendBucket,
} from "@/components/settings/spending";
import { cn, formatCurrency, formatInteger } from "@/lib/utils";

/** The unit the bars are read in. Same shape either way — one is a multiple of the other. */
export type SpendUnit = "credits" | "dollars";

/**
 * The plot box, in the SVG's own units.
 *
 * A `viewBox` rather than pixels, so the chart scales with the panel and every
 * measurement below stays a constant. The left inset leaves room for the axis labels
 * drawn outside the plot — a chart that has to reserve space for its own labels in CSS
 * ends up with the bars and the labels disagreeing at some width.
 */
const W = 900;
const H = 210;
const PAD = { top: 12, right: 6, bottom: 22, left: 48 };
const PLOT = {
  x: PAD.left,
  y: PAD.top,
  w: W - PAD.left - PAD.right,
  h: H - PAD.top - PAD.bottom,
};

/** Axis ticks only — see `showTick`. */
const AXIS_MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** How much of each slot the bar fills; the rest is the gap to its neighbour. */
const BAR_FILL = 0.62;

/**
 * What was spent, per day, week or month.
 *
 * Bars rather than the burn-down line this replaced. A descending line answers "will the
 * balance last"; bars answer "when did it go", which is the question a period switch
 * exists to ask. The forecast went with the line — nothing here is a prediction any more.
 *
 * Value labels are impossible at thirty bars, so the chart carries a **readout** instead:
 * one line above the plot that names the hovered bucket and its total, and falls back to
 * the window's own total when nothing is hovered. That beats a floating tooltip on two
 * counts — no positioning maths that can push it off the panel edge, and something
 * useful to read before you touch anything.
 */
export function SpendBars({
  buckets,
  period,
  unit,
}: {
  buckets: SpendBucket[];
  period: Period;
  unit: SpendUnit;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { range } = periodMeta(period);
  const total = buckets.reduce((sum, bucket) => sum + bucket.credits, 0);
  const peak = Math.max(...buckets.map((bucket) => bucket.credits), 1);

  /** Credits are the stored unit; dollars are a view of them. */
  const show = (credits: number) =>
    unit === "dollars" ? formatCurrency(usdFor(credits)) : `${formatInteger(credits)} cr`;

  /**
   * The same figure for an axis tick, without the cents.
   *
   * "$0.00 / $15.01 / $30.02" is three decimal points of noise on a scale nobody reads
   * to the penny. The readout above keeps them, because there you are looking at one
   * specific day.
   */
  const showTick = (credits: number) =>
    unit === "dollars"
      ? AXIS_MONEY.format(usdFor(credits) / 100)
      : formatInteger(Math.round(credits));

  const slot = PLOT.w / buckets.length;
  const barWidth = slot * BAR_FILL;
  const y = (credits: number) => PLOT.y + (1 - credits / peak) * PLOT.h;

  const active = hovered === null ? null : buckets[hovered];

  /*
   * Which bars get a label under them.
   *
   * Thirty labels do not fit, so this thins them to roughly six evenly spaced ones and
   * always keeps the last — the present is the one date you need to orient from, and an
   * even step can land anywhere.
   */
  const labelStep = Math.max(1, Math.ceil(buckets.length / 6));
  const labelled = (index: number) =>
    index === buckets.length - 1 || (buckets.length - 1 - index) % labelStep === 0;

  return (
    <figure className="flex flex-col gap-2">
      {/* The readout. `aria-live` off: this follows a pointer, and announcing every bar
          it crosses would be a stream of noise. The chart's own label carries the
          summary for anyone not using one. */}
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs text-muted-foreground">
          {active ? (
            <>
              {period === "weekly" ? "Week of " : null}
              <span className="font-medium text-foreground">{active.label}</span>
            </>
          ) : (
            range
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {show(active ? active.credits : total)}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Spending by ${period === "daily" ? "day" : period === "weekly" ? "week" : "month"}. ${range}, ${show(total)} in total. Highest ${period === "monthly" ? "month" : period === "weekly" ? "week" : "day"}: ${show(peak)}.`}
        data-slot="spend-bars"
        // Width-driven. With a fixed height and the default `preserveAspectRatio`, the
        // drawing letterboxes inside the panel instead of filling it.
        className="h-auto w-full overflow-visible"
        onPointerLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="spend-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop
              offset="100%"
              stopColor="color-mix(in oklab, var(--brand) 55%, transparent)"
            />
          </linearGradient>
        </defs>

        {/* Three gridlines is enough to read a proportion off; more turns the plot into
            graph paper. */}
        {[0, peak / 2, peak].map((value) => (
          <g key={value}>
            <line
              x1={PLOT.x}
              x2={PLOT.x + PLOT.w}
              y1={y(value)}
              y2={y(value)}
              stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
              strokeWidth={1}
            />
            <text
              x={PLOT.x - 8}
              y={y(value)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {showTick(value)}
            </text>
          </g>
        ))}

        {buckets.map((bucket, index) => {
          const x = PLOT.x + index * slot + (slot - barWidth) / 2;
          const top = y(bucket.credits);
          const height = PLOT.y + PLOT.h - top;
          const isActive = hovered === index;

          return (
            <g key={bucket.startsAt}>
              {/*
                A full-height hit area behind each bar. Without it you would have to hit
                the bar itself — impossible for an empty bucket, and a one-pixel target
                for a quiet day.
              */}
              <rect
                x={PLOT.x + index * slot}
                y={PLOT.y}
                width={slot}
                height={PLOT.h}
                fill="transparent"
                onPointerEnter={() => setHovered(index)}
              />

              {isActive ? (
                <rect
                  x={PLOT.x + index * slot}
                  y={PLOT.y}
                  width={slot}
                  height={PLOT.h}
                  fill="color-mix(in oklab, var(--foreground) 5%, transparent)"
                  className="pointer-events-none"
                  rx={3}
                />
              ) : null}

              <rect
                x={x}
                y={top}
                width={barWidth}
                // A floor of 2 units so an empty bucket still draws a mark. Nothing at
                // all reads as missing data rather than as a day off.
                height={Math.max(height, 2)}
                rx={Math.min(3, barWidth / 2)}
                fill="url(#spend-bar)"
                className={cn(
                  "pointer-events-none transition-opacity",
                  hovered !== null && !isActive ? "opacity-45" : "opacity-100",
                )}
              />
            </g>
          );
        })}

        {buckets.map((bucket, index) =>
          labelled(index) ? (
            <text
              key={bucket.startsAt}
              x={PLOT.x + index * slot + slot / 2}
              y={H - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {bucket.label}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  );
}
