"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Which render of this video you are looking at.
 *
 * Presentation only for now: the selection moves but the page below does not change,
 * because there is no per-version record to load yet. Every option therefore carries a
 * `title` saying so — a control that reads "v1" while a v3 poster sits beside it would
 * otherwise look like a bug rather than an unfinished feature.
 *
 * Segmented rather than a dropdown: an export has a handful of versions, all of them
 * one short token wide, so laying them out costs less space than a trigger that has to
 * be opened to see what the options even are.
 *
 * TODO: make the version a route segment (`/exports/[id]/v/[n]`) so a specific cut can
 * be linked, then load that version's poster and metadata with it.
 */
export function VersionSwitcher({
  /** The newest version, which is also how many there are. */
  latest,
}: {
  latest: number;
}) {
  const [active, setActive] = useState(latest);

  // Oldest first, so the numbers read left to right the way a version history does.
  const versions = Array.from({ length: latest }, (_, index) => index + 1);

  return (
    <div
      role="radiogroup"
      aria-label="Version"
      data-slot="version-switcher"
      className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.03] p-1 ring-1 ring-foreground/10 ring-inset"
    >
      {versions.map((version) => {
        const isActive = version === active;

        return (
          <button
            key={version}
            type="button"
            role="radio"
            aria-checked={isActive}
            // Spelled out because "v3" alone is not a description of anything.
            aria-label={`Version ${version}`}
            title="Switching version is not wired up yet"
            onClick={() => setActive(version)}
            className={cn(
              "h-7 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
              isActive
                ? "bg-brand text-brand-foreground shadow-sm shadow-brand/25"
                : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            v{version}
          </button>
        );
      })}
    </div>
  );
}
