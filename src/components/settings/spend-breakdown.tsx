"use client";

import { ChevronRight } from "lucide-react";

import { formatDuration, usdFor, type SpendGroup } from "@/components/settings/spending";
import { cn, formatCurrency, formatInteger } from "@/lib/utils";

/**
 * A ranked breakdown, one row per group.
 *
 * Bars behind the labels rather than a pie. A pie of ten projects is ten wedges nobody
 * can compare; a sorted bar list answers "what is biggest" by position alone and "by
 * how much" by length, and it stays readable at any number of rows. The bar is painted
 * as the row's own background so the label sits *in* it — a separate bar column would
 * have halved the width available for titles.
 *
 * Every row is a button when `onDrill` is supplied. That is the drill-down: the row you
 * are looking at is the thing you want to open, so it should not need a separate
 * affordance to the right of itself.
 */
export function SpendBreakdown({
  groups,
  onDrill,
  emptyMessage = "Nothing spent yet.",
}: {
  groups: SpendGroup[];
  /** Absent at the second level — the drill is two deep and then stops. */
  onDrill?: (group: SpendGroup) => void;
  emptyMessage?: string;
}) {
  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  /*
   * Bars are scaled to the biggest row, not to the total.
   *
   * Against the total, a library with twenty projects draws twenty near-invisible
   * slivers; against the leader, the shape of the ranking is visible whatever the
   * spread. The cost is that the top bar is always full — it means "most", not "all" —
   * which is why the credits and the dollar figure sit on every row rather than the bar
   * being the only thing to read.
   */
  const peak = Math.max(...groups.map((group) => group.credits));

  return (
    <ul data-slot="spend-breakdown" className="flex flex-col gap-1">
      {groups.map((group) => {
        const width = peak === 0 ? 0 : (group.credits / peak) * 100;

        const inner = (
          <>
            {/* The bar. Behind the content at `-z-10`, inside the row's own stacking
                context so it cannot slide under the panel instead. */}
            <span
              aria-hidden
              style={{ width: `${width}%` }}
              className="absolute inset-y-0 left-0 -z-10 rounded-lg bg-gradient-to-r from-brand/25 to-brand/10"
            />

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {group.label}
            </span>

            {/*
              Total generated length. The thing the credits actually bought, and the only
              column that says whether a big number is an expensive habit or simply a lot
              of video.

              First to go when the panel is narrow. Three trailing columns plus the
              chevron leave a 640px viewport — where the fixed sidebar takes 256px of it —
              with nothing at all for the label, which truncated to zero width. Measured
              against the panel rather than the viewport, because the panel is far
              narrower than a viewport breakpoint would assume.
            */}
            <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums @min-[30rem]:block">
              {formatDuration(group.seconds)}
            </span>

            {/* What it cost in money, beside what it cost in credits. Credits are the
                unit the product meters and stay the headline; this is the one people
                reconcile against a card statement. */}
            <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {formatCurrency(usdFor(group.credits))}
            </span>

            <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatInteger(group.credits)}
            </span>
          </>
        );

        const shared =
          "relative isolate flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left";

        return (
          <li key={group.key}>
            {onDrill ? (
              <button
                type="button"
                onClick={() => onDrill(group)}
                aria-label={`${group.label}: ${formatInteger(group.credits)} credits, ${formatCurrency(usdFor(group.credits))}, ${formatDuration(group.seconds)} of video. Open breakdown.`}
                className={cn(
                  shared,
                  "w-full transition-colors hover:bg-foreground/[0.04]",
                  "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
                )}
              >
                {inner}
                <ChevronRight
                  aria-hidden
                  className="-mr-1 size-4 shrink-0 text-muted-foreground/50"
                />
              </button>
            ) : (
              // Padded on the right by the width of the chevron the drillable rows
              // carry, so the two levels' numbers stay in the same column.
              <div className={cn(shared, "pr-[1.75rem]")}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
