"use client";

import { useEffect, useRef } from "react";

import { useSession } from "@/components/create/session-provider";
import { cn } from "@/lib/utils";

/**
 * The conversation half of a session.
 *
 * Every tab writes here — a story edit, a regenerated scene, each render as it
 * lands — so this is the running account of what the director did and why. It
 * only reads; the messages are composed where the action happens.
 */
export function DirectorPanel() {
  const { messages } = useSession();
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the conversation as it grows. `smooth` on a list that appends every
  // few seconds would still be animating when the next line arrives.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        The scroll viewport has to *end* above the composer, not merely pad its
        content past it.

        Bottom padding inside the scroller was the earlier attempt: it clears the last
        message, but the viewport still runs to the bottom of the column, underneath a
        composer that is absolutely positioned over it. So mid-scroll the messages slid
        behind a translucent glass frame and showed through it, and the scrollbar ran
        the full height of the column, past the box and off the bottom.

        Ending the viewport early fixes both at once: nothing can be behind the
        composer because the scrollable area stops before it.
      */}
      <div className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto pt-6 pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.from === "user" ? "justify-end" : "justify-start",
            )}
          >
            {/*
              Only the user gets a bubble. The director speaks as plain text — no
              surface, no outline, and therefore no padding either: an inset with
              nothing to inset from would just push the line off the column's left
              edge, out of line with the heading above it. Side and alignment still
              tell the two apart, so the box was doing no work.
            */}
            <p
              className={cn(
                "max-w-[88%] text-sm leading-relaxed",
                message.from === "user"
                  ? "rounded-2xl rounded-br-md border border-brand/25 bg-brand/10 px-3.5 py-2.5"
                  : "text-foreground/90",
              )}
            >
              {message.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/*
        The composer's footprint, as real layout rather than padding.
        `--composer-h` is measured and published by `CreateSession`; the extra 2.25rem
        is the composer's own 1.5rem offset from the bottom of the screen plus a gap so
        the last message does not touch it. The fallback covers the frame before the
        observer's first measurement lands.
      */}
      <div
        aria-hidden
        data-slot="composer-reserve"
        className="shrink-0"
        style={{ height: "calc(var(--composer-h, 5.5rem) + 2.25rem)" }}
      />
    </div>
  );
}
