"use client";

import { ChevronLeft, ChevronRight, Clapperboard, Play, Sparkles } from "lucide-react";
import { useState } from "react";

import { ASPECT_CLASS } from "@/components/create/aspect";
import { useSession } from "@/components/create/session-provider";
import { BrandButton } from "@/components/ui/brand-button";
import { cn } from "@/lib/utils";

/**
 * How many cuts each scene has to choose between.
 *
 * Mock data, varied so the switcher is visibly per-scene rather than one global
 * count — `2 + (index % 3)` walks 2, 3, 4, 2, 3 across five scenes.
 */
const takeCount = (index: number) => 2 + (index % 3);

/**
 * The assembled cut, and the takes it was assembled from.
 *
 * Presentational for now: the selected take lives in local state because there is
 * nothing behind it yet. When a real assembly exists this moves into the session,
 * next to the scene tracks it is choosing between.
 */
export function TestScreening() {
  const { tracks, settings, startFinalProduction } = useSession();
  const aspect = ASPECT_CLASS[settings.aspectRatio];

  return (
    <div className="flex flex-col gap-5">
      {/*
        Full width, fixed height, with the frame centred inside at the output's shape.
        Letting a portrait frame drive a full-width card would make it twice the
        panel's width tall; pinning the height and deriving the width from the aspect
        keeps both ratios inside the same box.

        `flex`, not `grid`: the frame sizes itself from `h-full`, and a percentage
        height only resolves against a definite container. A grid row is auto-sized
        even when the grid itself has a fixed height, so under `grid` the height came
        out indefinite, the aspect ratio ran the other way — width first — and a
        portrait frame measured 365px tall inside a 224px box.
      */}
      {/* `19.2rem` is `h-64` (16rem) plus 20%. Height only — the card is pinned to the
          full width of the section, so that is the one dimension left to grow. The
          padding goes up a step with it, or the fixed inset would make the frame
          inside grow 23% while the card grew 20%. */}
      <div
        data-slot="screening-preview"
        className="flex h-[19.2rem] w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5"
      >
        <div
          className={cn(
            "flex h-full items-center justify-center rounded-xl border border-border/60 bg-card/50",
            aspect,
          )}
        >
          <span className="px-3 text-center text-muted-foreground/80">
            <Play aria-hidden className="mx-auto size-7" />
            <span className="mt-2 block text-xs leading-tight">
              Assembled cut appears here
            </span>
          </span>
        </div>
      </div>

      {/*
        Centred rather than left-aligned: this row is a filmstrip of the cut above it,
        so it reads as belonging to the frame rather than starting a new column of
        content.

        Centre-when-it-fits, scroll-when-it-does-not, via `mx-auto` on a `w-max` inner
        row. `justify-center` inside a scroll container is the trap here: once the
        content overflows it pushes the overflow past the left edge where it cannot be
        scrolled back to. Wrapping was the other option and looked worse — five cards
        at this size break 4+1 on a 1180px window.

        `py-1 -my-1` because `overflow-x` clips vertically at the padding edge, which
        would otherwise shave the focus ring off each card.
      */}
      <div className="scrollbar-slim -my-1 overflow-x-auto py-1">
        <div
          data-slot="screening-scenes"
          className="mx-auto flex w-max items-start gap-3"
        >
          {tracks.map((track, index) => (
            <SceneTake
              key={track.id}
              label={`Scene ${index + 1}`}
              beat={track.beat}
              takes={takeCount(index)}
              aspect={aspect}
            />
          ))}
        </div>
      </div>

      {/* TODO: the final-render API call belongs behind this; for now it only flips
          the flag that splits the director column and reveals the production card. */}
      <BrandButton className="h-11 w-full justify-center" onClick={startFinalProduction}>
        <Sparkles aria-hidden className="size-4" />
        Generate Final Production
      </BrandButton>
    </div>
  );
}

function SceneTake({
  label,
  beat,
  takes,
  aspect,
}: {
  label: string;
  beat: string;
  takes: number;
  aspect: string;
}) {
  const [take, setTake] = useState(1);

  return (
    // `8.4rem` is `w-28` (7rem) plus 20%. Width only needs setting: the tile's height
    // comes from the aspect ratio, so it scales by the same fifth.
    <div className="flex w-[8.4rem] flex-col items-center gap-1.5">
      <div
        className={cn(
          "grid w-full place-items-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground/70",
          aspect,
        )}
      >
        <Clapperboard aria-hidden className="size-4" />
      </div>

      <span className="text-xs font-medium">{label}</span>

      {/*
        A stepper, not the `VersionList` dropdown used elsewhere: that opens a
        full-width list of previews, which cannot fit a 112px card. Here the whole
        control has to sit on one short line, so prev/next around a counter is the
        shape that works.
      */}
      <div className="flex items-center gap-0.5" data-slot="take-switcher">
        <TakeStep
          label={`Previous take of ${beat}`}
          Icon={ChevronLeft}
          onClick={() => setTake((current) => current - 1)}
          disabled={take === 1}
        />
        <span className="text-[11px] font-semibold text-brand-text tabular-nums">
          v{take}/{takes}
        </span>
        <TakeStep
          label={`Next take of ${beat}`}
          Icon={ChevronRight}
          onClick={() => setTake((current) => current + 1)}
          disabled={take === takes}
        />
      </div>
    </div>
  );
}

function TakeStep({
  label,
  Icon,
  onClick,
  disabled,
}: {
  label: string;
  Icon: typeof ChevronLeft;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // Icon-only, so the name lives in `aria-label`. Named by beat rather than
      // "previous": five of these on one row would otherwise be indistinguishable.
      aria-label={label}
      title={label}
      className={cn(
        "grid size-5 place-items-center rounded text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
        "disabled:opacity-30 disabled:hover:bg-transparent",
      )}
    >
      <Icon className="size-3" />
    </button>
  );
}
