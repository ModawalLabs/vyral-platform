"use client";

import { Clapperboard } from "lucide-react";
import Image from "next/image";

import { PromptBlock } from "@/components/media/prompt-block";
import { brandButtonClass } from "@/components/ui/brand-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PreviewItem } from "@/types/preview";

/**
 * A closer look at one video, wherever it was clicked.
 *
 * One component for all three surfaces — see `PreviewItem` for why they are mapped into
 * a common shape rather than the dialog branching on where it came from.
 *
 * Two columns on a wide screen: the picture takes the left and everything written about
 * it takes the right. Stacked below `md`, picture first, because on a phone the picture
 * is what you tapped to see.
 *
 * The stage is a **fixed-height** box and the picture scales down to fit inside it. Left
 * to its own size a 9:16 still is over a thousand pixels tall, and the thing you opened
 * the dialog to look at ends up below the fold. Bounding the stage puts a 16:9 poster and
 * a 9:16 one in the same box without cropping either — the mechanics of that are on the
 * stage itself, and they are fussier than they look.
 */
export function PreviewDialog({
  item,
  open,
  onOpenChange,
}: {
  /** Kept while the dialog animates out, so the content does not vanish mid-fade. */
  item: PreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Far wider than the primitive's `sm:max-w-sm` default, and capped in height so a
        long prompt scrolls inside the dialog rather than pushing it off the viewport.
        `p-0` because the stage runs to the edge — the padding is put back on the column
        beside it.
      */}
      <DialogContent
        data-slot="preview-dialog"
        className="max-h-[min(90vh,52rem)] w-full gap-0 overflow-y-auto p-0 sm:max-w-3xl lg:max-w-5xl"
      >
        {item ? <PreviewBody item={item} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ item, onDone }: { item: PreviewItem; onDone: () => void }) {
  const { media } = item;

  return (
    <div className="grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* The mat around the frame is deliberately plain: a poster of unknown brightness
          needs a neutral surround, and a portrait cut leaves a lot of it on either
          side. */}
      <div
        data-slot="preview-stage"
        // A definite height at *every* breakpoint. Left to `h-auto` on md and up, the
        // stage took the picture's natural height instead of bounding it — a 9:16 still
        // came out 1021px tall inside a dialog capped at 90vh, so the picture you opened
        // the dialog to see had to be scrolled to.
        className="flex h-[clamp(15rem,46vh,30rem)] min-h-0 items-center justify-center overflow-hidden bg-foreground/[0.04] p-5"
      >
        {media.thumbnailUrl ? (
          /*
           * The picture sizes itself, rather than being poured into a frame.
           *
           * A `<div>` carrying `aspect-ratio` alongside a definite height does *not*
           * recompute that height when `max-width` clamps it — the box is simply
           * squashed, and a 2:1 frame came out at 1.24:1 in this column. A replaced
           * element with `max-w-full max-h-full` and both dimensions auto is the one
           * thing that scales down proportionally, which is exactly the behaviour
           * wanted here.
           *
           * `width`/`height` only reserve the box before the file loads; the rendered
           * shape comes from the file itself, so nothing is cropped at any ratio.
           */
          <Image
            data-slot="preview-frame"
            src={media.thumbnailUrl}
            alt={media.alt}
            width={1600}
            height={Math.round(1600 / media.ratio)}
            // The dialog is at most 5xl, and the stage is the wider of its two columns.
            sizes="(min-width: 1024px) 55vw, 90vw"
            // Eager because by the time this mounts it *is* the most important thing on
            // screen — the dialog opened to show it.
            loading="eager"
            className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain ring-1 ring-foreground/10 ring-inset"
          />
        ) : (
          /*
           * A template with no still yet. The tile *is* the honest state — there is
           * nothing to show, and an empty box would read as a failed load.
           *
           * With no image to size it this is a plain box, so it hits the clamping
           * problem described above: whichever dimension is definite wins and the other
           * is squashed. The fix is to make the *binding* dimension the definite one —
           * a wide plate is sized from the width it has, a tall one from the height.
           * Left height-driven, a 2:1 plate came out at 1.29:1.
           */
          <div
            data-slot="preview-frame"
            style={{ aspectRatio: media.ratio }}
            className={cn(
              "grid place-items-center rounded-xl bg-muted/40 text-muted-foreground/60 ring-1 ring-foreground/10 ring-inset",
              media.ratio >= 1 ? "max-h-full w-full" : "h-full max-w-full",
            )}
          >
            <Clapperboard aria-hidden className="size-9" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-5 p-6">
        <DialogHeader className="gap-1">
          {item.eyebrow ? (
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {item.eyebrow}
            </p>
          ) : null}
          {/* `pr-8` clears the primitive's close button, which is pinned to this
              corner. */}
          <DialogTitle className="pr-8 font-heading text-lg leading-tight font-semibold tracking-tight text-balance">
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <dl className="grid gap-3">
          {item.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <dt className="shrink-0 text-xs text-muted-foreground">{fact.label}</dt>
              {/* `text-right` so the values form a column against the panel's right
                  edge, which is what makes unrelated facts scan as a set. */}
              <dd className="truncate text-right text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <PromptBlock prompt={item.prompt} />

        {/*
          The action, when there is one — and nothing at all when there is not.

          There is no Close button here. The dialog already offers three ways out: the ×
          pinned to this corner, Escape, and the backdrop. A fourth spelled-out one only
          competed with the action beside it for the eye, and on a project — which has no
          action — it left a footer whose sole content was a way to dismiss what you had
          just opened.

          `mt-auto` pins it to the bottom on a wide screen, where this column is stretched
          to the stage's height.
        */}
        {item.action ? (
          <div className="mt-auto flex flex-col pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              title={item.action.title}
              onClick={() => {
                item.action?.onClick?.();
                // Closes either way. An action that is not wired up yet still has to
                // dismiss the dialog, or pressing it looks broken rather than pending.
                onDone();
              }}
              className={cn(brandButtonClass, "justify-center")}
            >
              {item.action.label}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
