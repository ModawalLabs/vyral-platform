"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type RevisionEntry = {
  id: string;
  label: string;
  /** The settings this revision was saved under, so two identical drafts differ. */
  meta: string;
  /** Opening words of the prose. */
  preview: string;
};

/**
 * The story's revisions as a horizontal filmstrip.
 *
 * Chronological left to right, because that is what a strip of takes reads as —
 * a progression rather than a ranked list. Revision 1 therefore sits at the left
 * edge and is what a fresh session opens on; each new one is appended to its
 * right. The cost is that the newest ends up furthest from the left edge, which
 * is also the one you are usually on, so the active card is scrolled into view
 * instead of leaving it to be hunted for.
 */
export function RevisionRail({
  revisions,
  activeId,
  onSelect,
  locked,
}: {
  revisions: RevisionEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  /**
   * Selectable but inert, rather than hidden, while an edit is open.
   *
   * Switching mid-edit would discard the draft silently. Removing the strip
   * would say so even less, and would jump the prose box up the page every time
   * Edit is pressed.
   */
  locked?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  /**
   * Bring the active card into view.
   *
   * Adjusts `scrollLeft` on the rail directly rather than calling
   * `scrollIntoView`, which walks up the ancestor chain — here that means the
   * scrolling workspace column and the glass-backed panel behind it, both of
   * which would move for what should be a change inside one row.
   */
  useEffect(() => {
    const rail = railRef.current;
    const card = activeRef.current;
    if (!rail || !card) return;

    const railBox = rail.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    rail.scrollLeft += cardBox.left - railBox.left - (railBox.width - cardBox.width) / 2;
  }, [activeId, revisions.length]);

  // Rendered even for a single revision, unlike the scene cards' dropdown. This
  // strip is the only thing on the page saying which revision is active, so it
  // has to be there from the first one — and starting with one selected card
  // teaches the affordance before there is anything to switch to.
  return (
    <div
      ref={railRef}
      data-slot="revision-rail"
      // `py-1` with a matching negative margin: `overflow-x` clips vertically at
      // the padding edge, which would otherwise shave the focus ring off the top
      // and bottom of every card.
      className="scrollbar-slim -my-1 flex snap-x snap-mandatory gap-2 overflow-x-auto py-1"
    >
      {revisions.map((revision) => {
        const isActive = revision.id === activeId;
        return (
          <button
            key={revision.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onSelect(revision.id)}
            disabled={locked}
            aria-current={isActive ? "true" : undefined}
            title={
              locked ? "Save or cancel your edit before switching revision" : undefined
            }
            className={cn(
              "flex w-48 shrink-0 snap-start flex-col gap-1 rounded-xl border p-2.5 text-left transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
              isActive
                ? "border-brand/50 bg-brand/10"
                : "border-border/60 bg-card/40 hover:border-border hover:bg-muted/50",
              locked && "pointer-events-none opacity-50",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-brand-text" : "text-foreground/80",
                )}
              >
                {revision.label}
              </span>
              {isActive ? (
                <Check aria-hidden className="ml-auto size-3.5 text-brand" />
              ) : null}
            </span>

            <span className="truncate text-[10px] text-muted-foreground tabular-nums">
              {revision.meta}
            </span>

            {/* Two lines: enough to tell two takes apart, not enough to turn the
                strip into a wall of prose. */}
            <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {revision.preview}
            </span>
          </button>
        );
      })}
    </div>
  );
}
