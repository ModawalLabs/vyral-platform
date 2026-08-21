"use client";

import { useEffect, useRef } from "react";

import { ScenePicker } from "@/components/create/scene-picker";
import { DirectorTyping } from "@/components/create/director-typing";
import { IntakeProceed } from "@/components/create/intake-proceed";
import { SelectedScenes } from "@/components/create/selected-scenes";
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
  const { messages, scenesGenerated, selectedSceneIds, intakeTyping } = useSession();
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the conversation as it grows. `smooth` on a list that appends every
  // few seconds would still be animating when the next line arrives.
  //
  // The selection counts as growth: its cards render at the foot of the scroller, so
  // ticking a scene while the chat is already full would otherwise put them just out
  // of sight below the fold.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedSceneIds, intakeTyping]);

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
      <div
        data-slot="chat-scroller"
        className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto pt-6 pr-1"
      >
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

        {/* Both of these sit after the messages rather than among them, because both
            belong to *now* rather than to the transcript: the indicator is the line
            still being written, and Proceed answers the question at the bottom. */}
        {intakeTyping ? <DirectorTyping /> : null}
        <IntakeProceed />

        {/* Current state, not something that was said — so it stays at the foot of the
            conversation instead of being stranded at whatever point it was ticked. */}
        <SelectedScenes />

        <div ref={endRef} />
      </div>

      {/*
        Sits directly on top of the composer, in flow rather than positioned over it.

        The reserve below is measured from the composer, so as the field grows the
        reserve grows and this is pushed up with it — the pill can never be overlapped
        by the box it belongs to. `pt-3` separates it from the last message; the gap
        below it is the reserve's own 0.75rem, so no padding is needed on that side.

        Gated on `scenesGenerated` because before that there is nothing to list.
      */}
      {scenesGenerated ? (
        <div className="shrink-0 pt-3">
          <ScenePicker />
        </div>
      ) : null}

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
