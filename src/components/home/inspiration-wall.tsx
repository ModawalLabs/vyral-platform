"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";

import { useComposer } from "@/components/home/composer-provider";
import { usePreview } from "@/components/preview/preview-provider";
import { cn } from "@/lib/utils";
import type { Resolution, SessionSettings } from "@/types/session";

type Aspect = "9:16" | "16:9";

type InspirationItem = {
  src: string;
  alt: string;
  label: string;
  aspect: Aspect;
  prompt: string;
  /** What the dialog reports. Curated examples, so these are part of the reference. */
  model: SessionSettings["model"];
  resolution: Resolution;
  durationSeconds: number;
};

/**
 * Mock content — swap for a curated feed once the library exists.
 *
 * Three of each format, and the artwork is genuinely shot that way: the inspiration
 * assets are 9:16 files and the three landscape ones are 16:9. Nothing here is a
 * portrait crop of a wide image, which matters because the whole point of the section
 * is now to show what both shapes look like.
 *
 * Every label, alt and prompt is written to the picture rather than to the path, because
 * several filenames describe something else entirely: `neon-alley-chase` is a rider in
 * orange dust, `black-sand-aerial` is a burning scarecrow, `social-ad` is a gelato macro
 * and `cosmic-journey` is a flat illustration rather than anything photoreal. The old
 * rail inherited two of those mismatches; do not "correct" this copy back against the
 * filenames. Same trap documented in `src/data/exports.ts`.
 *
 * The order is load-bearing: see `InspirationWall`.
 */
const INSPIRATION: readonly InspirationItem[] = [
  {
    src: "/assets/inspiration/cosmic-journey.webp",
    model: "Seedance",
    resolution: "1080p",
    durationSeconds: 8,
    alt: "An illustrated girl floating weightlessly among painted planets",
    label: "Animation",
    aspect: "9:16",
    prompt:
      "A girl drifting weightless through a field of painted planets, flat illustration, slow float",
  },
  {
    src: "/assets/projects/neon-alley-chase.webp",
    model: "Veo3",
    resolution: "1080p",
    durationSeconds: 10,
    alt: "A rider on a dirt bike throwing up a wall of orange dust",
    label: "Action",
    aspect: "16:9",
    prompt:
      "Low chase camera on a dirt bike at golden hour, thick dust trail, heat shimmer",
  },
  {
    src: "/assets/projects/black-sand-aerial.webp",
    model: "Hunyuan",
    resolution: "1080p",
    durationSeconds: 12,
    alt: "A burning scarecrow standing in a wheat field at dusk",
    label: "Horror",
    aspect: "16:9",
    prompt:
      "A wicker effigy burning in a wheat field at dusk, slow orbit, firelight only",
  },
  {
    src: "/assets/inspiration/music-video.webp",
    model: "Kling T2V",
    resolution: "1080p",
    durationSeconds: 9,
    alt: "A performer lit by coloured stage lights",
    label: "Music",
    aspect: "9:16",
    prompt:
      "Stage performance under strobing colour gels, handheld camera, shallow depth of field",
  },
  {
    src: "/assets/inspiration/social-ad.webp",
    model: "Veo3",
    resolution: "1080p",
    durationSeconds: 6,
    alt: "Syrup pouring over a scoop of strawberry gelato in close-up",
    label: "Food",
    aspect: "9:16",
    prompt:
      "Syrup pouring over strawberry gelato in macro, backlit, razor-thin focus, no cuts",
  },
  {
    src: "/assets/projects/espresso-macro.webp",
    model: "Kling",
    resolution: "720p",
    durationSeconds: 11,
    alt: "Two designers pinning reference prints to a moodboard wall",
    label: "Studio",
    aspect: "16:9",
    prompt:
      "Two designers at a moodboard wall, warm window light, handheld documentary feel",
  },
];

/**
 * A wall of reference cuts, in both shapes the product makes.
 *
 * It used to be a horizontal rail of five portrait cards, which quietly implied the
 * product only made vertical video. A portrait and a landscape card cannot share both a
 * width and a height, so one of the two has to give — this shares the **width**, because
 * a card carrying a label and a line of prompt needs a usable measure far more than it
 * needs to line up with its neighbour's bottom edge. Heights then follow each image's own
 * aspect and nothing is cropped.
 *
 * CSS multi-column rather than a grid. A grid would need every card assigned a row span,
 * and 9:16 against 16:9 is a ratio of 3.16 — not a whole number of rows, so the spans
 * would only fit by cropping something. Columns balance themselves and reflow from three
 * to two to one for free.
 *
 * The order matters. Column balancing fills each column to an equal target height, and
 * one portrait plus one landscape is almost exactly one third of the total — so
 * `P, L, L, P, P, L` puts a portrait at the top of the outer columns and a landscape at
 * the top of the middle one. That stagger is what stops six cards reading as two tidy
 * rows of three.
 */
export function InspirationWall() {
  return (
    <section className="min-w-0">
      {/* Same typography as `SectionRail`'s header, which the Trending block still uses —
          the two sections have to keep matching even though only one is a rail now. */}
      <header className="mb-4 min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">
          Get inspired for your next video
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Start from a look that already works, then make it yours. Vertical and landscape
          — both come out of the same prompt.
        </p>
      </header>

      {/*
        `gap-4` on a multi-column container sets the *column* gap only, so the vertical
        space between stacked cards comes from each card's own bottom margin.
      */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {INSPIRATION.map((item, index) => (
          <InspirationCard key={item.src} item={item} priority={index < 2} />
        ))}
      </div>
    </section>
  );
}

function InspirationCard({
  item,
  priority,
}: {
  item: InspirationItem;
  priority: boolean;
}) {
  const { applyPrompt } = useComposer();
  const preview = usePreview();

  /*
   * Built here, not in the dialog.
   *
   * "Try now" needs `applyPrompt`, which only exists inside the home page's
   * `ComposerProvider` — and the dialog is mounted in the workspace layout, outside it.
   * Handing the action over as a closure is what lets one dialog carry a different
   * primary action on every surface without knowing about any of them.
   */
  const open = () =>
    preview.open({
      id: item.src,
      title: item.label,
      eyebrow: "Inspiration",
      media: {
        thumbnailUrl: item.src,
        alt: item.alt,
        ratio: item.aspect === "9:16" ? 9 / 16 : 16 / 9,
      },
      prompt: item.prompt,
      facts: [
        { label: "Model", value: item.model },
        { label: "Aspect ratio", value: item.aspect },
        { label: "Resolution", value: item.resolution },
        { label: "Duration", value: `${item.durationSeconds}s` },
      ],
      action: { label: "Try now", onClick: () => applyPrompt(item.prompt) },
    });

  return (
    <article
      data-slot="inspiration-card"
      data-aspect={item.aspect}
      className={cn(
        // `break-inside-avoid` is what keeps a card whole instead of letting the column
        // break through the middle of it.
        "group mb-4 break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-border/60",
        "relative transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-1 hover:shadow-[0_22px_50px_-20px_color-mix(in_oklab,var(--brand)_60%,transparent)]",
      )}
    >
      {/* The aspect lives on a wrapper rather than on the card, so the card's own height
          is derived from the picture instead of asserted over it. */}
      <div
        className={cn(
          "relative",
          item.aspect === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]",
        )}
      >
        <Image
          src={item.src}
          alt={item.alt}
          fill
          // Column width, not viewport width: three columns at `lg`, two at `sm`, one
          // below that.
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        {/*
          The scrim, and everything on it, is revealed rather than permanent.

          A landscape card is barely a third the height of a portrait one, so a fixed
          bottom scrim with three lines of prompt on it covered most of the picture. Held
          back until hover, both formats are pure artwork at rest — which is what makes a
          wall of two different shapes read as one set.

          `group-focus-within` matters as much as `group-hover`: Try now stays focusable
          while transparent, so tabbing to it has to bring the panel with it.
          `(hover: none)` pins it open on touch, where there is no hover to discover.
        */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent",
            "opacity-0 transition-opacity duration-300",
            "group-focus-within:opacity-100 group-hover:opacity-100",
            "[@media(hover:none)]:opacity-100",
          )}
        />

        {/* The two chips stay at rest — they are the card's label, not its detail. Each
            carries its own plate, so neither depends on the scrim to stay legible over
            arbitrary artwork. */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {item.label}
          </span>
          {/* The format, stated. With both shapes on one wall the difference is visible
              but not nameable, and the ratio is the thing you would actually go looking
              for when picking a starting point. */}
          <span
            data-slot="aspect-chip"
            className="rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/75 tabular-nums backdrop-blur-md"
          >
            {item.aspect}
          </span>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-3.5",
            // Rises as it fades in. The 4px is deliberately small — this is a reveal, not
            // an entrance.
            "translate-y-1 opacity-0 transition-[opacity,transform] duration-300",
            "group-focus-within:translate-y-0 group-focus-within:opacity-100",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          )}
        >
          <p className="line-clamp-3 text-[12.5px] leading-snug text-white/90">
            {item.prompt}
          </p>

          {/* A cue, not a control: the whole card is the button now, so a second
              focusable thing inside it would be a target within a target. */}
          <span className="inline-flex items-center gap-1 self-start text-xs font-semibold text-brand-on-media">
            <Maximize2 aria-hidden className="size-3.5" />
            View details
          </span>
        </div>
        {/*
          The whole tile is the target, as a transparent overlay rather than by wrapping
          the article in a button — a button cannot contain an `<article>`, and the
          reveal panel underneath has no controls of its own to shadow.
        */}
        <button
          type="button"
          onClick={open}
          aria-label={`Preview ${item.label}: ${item.prompt}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
        />
      </div>
    </article>
  );
}
