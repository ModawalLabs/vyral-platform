"use client";

import { DirectorPanel } from "@/components/create/director-panel";
import { FinalProductionCard } from "@/components/create/final-production-card";
import { useSession } from "@/components/create/session-provider";

/** One treatment, so the heading reads identically wherever it ends up. */
const HEADING = "shrink-0 text-sm font-semibold tracking-wide uppercase";

/**
 * The left half of a running session.
 *
 * Just the conversation until the final render is asked for, at which point the column
 * splits 30/70 — the finished production on top, the chat below.
 *
 * The heading travels with the chat rather than staying at the top of the column: it
 * labels the conversation, and left above a production card it would have looked like
 * that card's title.
 *
 * The two panes live in their own flex container rather than as direct children of the
 * column. As siblings of anything else, `basis-[30%]` and `basis-[70%]` resolve against
 * the whole column, overflow it, and get shrunk back — landing near 30/70 but not on
 * it. Nesting gives the pair a container whose height is exactly what they divide.
 */
export function DirectorColumn() {
  const { finalProductionStarted } = useSession();

  if (!finalProductionStarted) {
    return (
      <>
        <h2 className={`${HEADING} pt-6`}>AI Director</h2>
        <DirectorPanel />
      </>
    );
  }

  return (
    <div data-slot="director-split" className="flex min-h-0 flex-1 flex-col">
      {/* No `gap` on the container: a gap comes off the two panes and would make them
          29.6/69 of the space rather than the 30/70 asked for. The breathing room is
          each pane's own padding, so it lands inside its share. */}
      <div className="flex min-h-0 basis-[30%] flex-col pt-6 pb-3">
        <FinalProductionCard />
      </div>
      <div className="flex min-h-0 basis-[70%] flex-col">
        <h2 className={HEADING}>AI Director</h2>
        <DirectorPanel />
      </div>
    </div>
  );
}
