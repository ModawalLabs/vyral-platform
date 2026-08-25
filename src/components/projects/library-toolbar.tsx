"use client";

import { MousePointerClick, X } from "lucide-react";
import type { ReactNode } from "react";

import { FilterMenu } from "@/components/projects/filter-menu";
import {
  activeChips,
  clearChip,
  clearFilters,
  countByFormat,
  countByStatus,
  FORMAT_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type ProjectFilters,
} from "@/components/projects/project-filters";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

/**
 * Filters and the mode switch, over one grid.
 *
 * The same bar serves the whole library and a single folder — the only difference is
 * the pool it counts against, which is passed in. That is deliberate: a folder that
 * filtered differently from the library would be a second thing to learn for no gain.
 *
 * The search box is deliberately *not* here. It sits above the folder rail, where it
 * reads as a search of the whole library rather than of whatever the grid currently
 * holds. Its value still lives in the same `filters` object, so the chips below cover
 * it like any other narrowing.
 *
 * Two rows, and the second only exists when something is narrowing. Active filters are
 * repeated as removable chips even though the pills already show their values, because
 * the pills say what each control is *set to* while the chips say what is being *taken
 * away* — and the second question is the one you ask when the grid looks emptier than
 * you expected.
 */
export function ProjectToolbar({
  filters,
  onFiltersChange,
  pool,
  selectMode,
  onToggleSelectMode,
  actions,
}: {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  /** What the option counts are measured against — the library, or one folder. */
  pool: readonly Project[];
  selectMode: boolean;
  onToggleSelectMode: () => void;
  actions?: ReactNode;
}) {
  const chips = activeChips(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          neutralValue="all"
          onChange={(status) => onFiltersChange({ ...filters, status })}
          countFor={(status) => countByStatus(pool, filters, status)}
        />

        <FilterMenu
          label="Format"
          value={filters.format}
          options={FORMAT_OPTIONS}
          neutralValue="all"
          onChange={(format) => onFiltersChange({ ...filters, format })}
          countFor={(format) => countByFormat(pool, filters, format)}
        />

        {/* No `neutralValue`: an order is always in force, so this pill never lights up
            as "narrowing" — it would be lit permanently and stop meaning anything. */}
        <FilterMenu
          label="Sort"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(sort) => onFiltersChange({ ...filters, sort })}
          align="end"
        />

        {/* Its own row on a phone: at 420px these are wider than what is left of the
            line, and a non-wrapping group there pushed buttons off the side of the page.
            From `sm` up it goes back to riding the toolbar. */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            onClick={onToggleSelectMode}
            aria-pressed={selectMode}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              selectMode
                ? "border-brand/45 bg-brand/10 text-brand-text"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            <MousePointerClick aria-hidden className="size-4" />
            {selectMode ? "Done" : "Select"}
          </button>

          {actions}
        </div>
      </div>

      {chips.length > 0 ? (
        <div
          data-slot="active-filters"
          className="flex flex-wrap items-center gap-1.5 text-xs"
        >
          <span className="text-muted-foreground">Filtered by</span>

          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFiltersChange(clearChip(filters, chip.key))}
              aria-label={`Remove filter ${chip.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-brand/35 bg-brand/10 py-1 pr-1.5 pl-2.5 font-medium text-brand-text transition-colors hover:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
            >
              {chip.label}
              <X aria-hidden className="size-3" />
            </button>
          ))}

          {/* Only offered once there are two things to clear — with one chip it would
              duplicate the × beside it. */}
          {chips.length > 1 ? (
            <button
              type="button"
              onClick={() => onFiltersChange(clearFilters(filters))}
              className="ml-1 rounded px-1 text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
