"use client";

import { useState } from "react";

import { EXPORT_STATUS_META } from "@/components/exports/export-status";
import { EXPORT_STATUSES, type ExportStatus } from "@/types/export";
import { cn } from "@/lib/utils";

type Choice = ExportStatus | "all";

/**
 * Status filter for the export list.
 *
 * Presentation only, by request: the selection moves but the list below does not
 * change. That is a deliberate decision, not an oversight — so every pill carries a
 * `title` saying so, because a control that highlights "Failed" while three completed
 * exports sit under it otherwise reads as a bug rather than as an unfinished feature.
 *
 * TODO: lift `active` to a `?status=` search param and filter server-side. A URL
 * param rather than local state so a filtered list can be linked and survives a
 * reload, and server-side so the page never ships the rows it is not showing.
 */
export function StatusFilter({
  counts,
}: {
  /** Every status plus the total, so a pill can show a zero rather than vanish. */
  counts: Record<ExportStatus, number> & { all: number };
}) {
  const [active, setActive] = useState<Choice>("all");

  const choices: Array<{ value: Choice; label: string; count: number }> = [
    { value: "all", label: "All", count: counts.all },
    ...EXPORT_STATUSES.map((status) => ({
      value: status as Choice,
      label: EXPORT_STATUS_META[status].label,
      count: counts[status],
    })),
  ];

  return (
    // A `group` of toggles, not a `radiogroup`: these are pressed buttons rather than
    // form inputs, and `aria-pressed` is what conveys the state without a form to post.
    <div
      role="group"
      aria-label="Filter exports by status"
      data-slot="status-filter"
      className="flex flex-wrap items-center gap-2"
    >
      {choices.map(({ value, label, count }) => {
        const isActive = value === active;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setActive(value)}
            aria-pressed={isActive}
            title="Filtering is not wired up yet — the list below is unchanged"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
              isActive
                ? // The selected pill is the one place on this page the brand fill
                  // appears at small size, which is what makes the selection obvious
                  // without needing a heavier control.
                  "bg-brand text-brand-foreground shadow-sm shadow-brand/25"
                : "text-muted-foreground ring-1 ring-foreground/10 ring-inset hover:bg-foreground/[0.04] hover:text-foreground",
            )}
          >
            {label}
            {/* The count rides inside the pill rather than in the label, so the
                accessible name stays "Completed 3" and not a renamed control. */}
            <span
              className={cn(
                "tabular-nums",
                isActive ? "text-brand-foreground/70" : "text-muted-foreground/70",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
