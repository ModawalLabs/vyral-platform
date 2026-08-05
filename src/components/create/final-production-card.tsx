"use client";

import { Download, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Stand-in poster frame, reusing art already in the repo.
 *
 * Do not read the filename as a description — it says `neon-alley-chase`, but the
 * frame is actually a cyclist throwing up dust in daylight. It loosely echoes the
 * seeded Hook beat ("a cyclist cuts through frame, spray lifting behind") and nothing
 * else about the story, so swap it the moment there is a real render to show.
 */
const POSTER = "/assets/projects/neon-alley-chase.webp";

/** How long the render is mocked as taking. */
const PROCESSING_MS = 10_000;

/**
 * What the render is nominally doing, in order.
 *
 * Four steps over ten seconds is 2.5s each, so one pass fills the phase exactly. The
 * index still wraps, so a longer phase loops rather than sticking on the last line.
 */
const STEPS = [
  "Understanding brand context…",
  "Matching tone: cinematic + premium",
  "Selecting optimal camera angles…",
  "Enhancing lighting consistency…",
];

const STEP_MS = PROCESSING_MS / STEPS.length;

/**
 * The final render, above the conversation.
 *
 * Placeholder: there is no renderer behind the button yet, so the card is the frame
 * the output will occupy and nothing else. It fills its pane rather than sizing to
 * content — `flex-1` here, `min-h-0` on the frame so it shrinks with the pane instead
 * of pushing past the 30% the column allots it.
 *
 * Deliberately *not* constrained to the session's aspect ratio, unlike the test
 * screening's preview: a ratio can either match the output or fill the box, not both,
 * and filling is what this card is for.
 *
 * The processing pass is timed from mount, which is the right trigger because the card
 * only mounts when the render is asked for. When a real renderer exists, both the
 * duration and the step text come from the job instead of from constants here.
 */
export function FinalProductionCard() {
  const [processing, setProcessing] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = window.setTimeout(() => setProcessing(false), PROCESSING_MS);
    // Advances on a modulo so it loops; the phase ending is what stops it, not the
    // end of the list.
    const ticker = window.setInterval(
      () => setStep((current) => (current + 1) % STEPS.length),
      STEP_MS,
    );

    return () => {
      window.clearTimeout(done);
      window.clearInterval(ticker);
    };
  }, []);

  return (
    <section
      data-slot="final-production"
      aria-label="Final production"
      className="flex min-h-0 flex-1 flex-col gap-2"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Final production</h3>

        {/* Moved up here from inside the body, which is now edge-to-edge frame.
            TODO: enabled by the render completing, once there is a render. */}
        <button
          type="button"
          disabled
          aria-label="Download final production"
          // Not "available once the render finishes" any more — the frame above now
          // *looks* finished, so that would have been a small lie.
          title="Download is not wired up yet"
          className="grid size-7 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground disabled:opacity-40"
        >
          <Download className="size-3.5" />
        </button>
      </div>

      {/* Dashed while there is nothing to show, like every other not-yet-rendered
          surface in the app — the clip slots, the media tiles, the screening preview.
          Solid once a frame lands, because by then it is a result, not a placeholder. */}
      <div
        data-slot="final-production-frame"
        data-processing={processing ? "" : undefined}
        className={cn(
          "relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-2xl border bg-card/40 text-muted-foreground/60",
          processing ? "border-dashed border-border/60" : "border-border/60",
        )}
      >
        {processing ? (
          <>
            {/*
              Two bands crossing the frame at different speeds. `inset-0` with a
              transparent→colour→transparent gradient and a full-width translate is the
              same shape the composer's sheen uses: the bright middle crosses the frame
              and both ends leave cleanly, with no visible edge entering or exiting.

              Both are `--foreground` at low alpha rather than one being a fixed light
              sheen. `--foreground` flips with the theme, so the pair reads as shadow
              over a light card and highlight over a dark one. A white sheen was
              invisible on the light card — measured, not guessed.
            */}
            <span
              aria-hidden
              className="animate-render-shadow absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent"
            />
            <span
              aria-hidden
              className="animate-render-sheen absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.16] to-transparent"
            />

            {/*
              `relative` so it paints above the two absolute bands: positioned elements
              sit above in-flow content, so without it the sheen would wash over the
              text rather than behind it.

              `aria-hidden`, with one calm announcement below instead. A `role="status"`
              here would re-announce every 2.5s, which is noise rather than progress —
              the steps are reassurance for the eye.
            */}
            <p
              aria-hidden
              data-slot="render-step"
              className="relative px-6 text-center text-xs font-medium text-foreground/75"
            >
              <span key={step} className="animate-phrase-in inline-block">
                {STEPS[step]}
              </span>
            </p>

            <span role="status" className="sr-only">
              Rendering the final production
            </span>
          </>
        ) : (
          <>
            {/* `alt=""` on purpose: it stands in for a poster frame, and the section
                already carries the accessible name. Describing stock art would be
                announcing something that is not really there. */}
            <Image
              src={POSTER}
              alt=""
              fill
              sizes="(min-width: 640px) 34vw, 100vw"
              className="object-cover"
            />

            {/*
              A disc behind the glyph rather than the glyph alone: over a photograph a
              bare icon lands on whatever happens to be underneath it, and this still is
              bright in the middle. Same treatment the project cards use for their hover
              actions, so the two read as one language.

              Decorative — there is no video to play yet, so it is not a button and does
              not take focus.
            */}
            <span
              aria-hidden
              className="relative grid size-12 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md"
            >
              <Play className="size-5 translate-x-px" />
            </span>
          </>
        )}
      </div>
    </section>
  );
}
