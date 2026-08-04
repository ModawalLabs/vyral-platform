"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type VersionEntry = {
  id: string;
  label: string;
  /** One line of the version's content, so the list is scannable. */
  preview: string;
};

/**
 * Collapsed take history for one scene, expandable in place.
 *
 * Deliberately compact: a scene card already carries eight fields and a clip
 * slot, and its history is an aside rather than the point of the card. The
 * brief's revisions get `RevisionRail` instead — they are the thing you steer
 * the whole session with, so they are worth a filmstrip.
 */
export function VersionList({
  entries,
  activeId,
  onActivate,
  className,
}: {
  entries: VersionEntry[];
  activeId: string;
  onActivate: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // One version is not a history.
  if (entries.length < 2) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        // Brand-coloured rather than muted: history is the one control people go
        // looking for here, and it was disappearing into the surrounding
        // metadata. `--brand-text`, not `--brand`, because at these sizes it
        // needs 4.5:1 and plain --brand only reaches 4.0:1 on the dark card.
        className="inline-flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold text-brand-text transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        {entries.length} versions
        <ChevronDown
          aria-hidden
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul className="mt-1.5 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
          {/* Newest first: the thing you just did is the thing you are most
              likely to be undoing. */}
          {[...entries].reverse().map((entry) => {
            const isActive = entry.id === activeId;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onActivate(entry.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2 px-2.5 py-2 text-left transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    isActive ? "bg-brand/10" : "hover:bg-muted/60",
                  )}
                >
                  <span className="mt-0.5 w-3 shrink-0">
                    {isActive ? <Check className="size-3 text-brand" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium">{entry.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {entry.preview}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
