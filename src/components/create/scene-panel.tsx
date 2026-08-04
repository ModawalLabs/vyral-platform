"use client";

import { ArrowLeft, ArrowRight, ImagePlus } from "lucide-react";
import Image from "next/image";

import { VersionList } from "@/components/create/version-list";
import { placeholderFor } from "@/lib/session/assets";
import { activeScene } from "@/lib/session/scenes";
import type { SceneTrack } from "@/types/session";
import { cn } from "@/lib/utils";

/** Every line the panel shows, in order. `beat` is identity, not a field. */
const FIELDS = [
  { key: "durationSeconds", label: "Duration", suffix: "s" },
  { key: "visual", label: "Visual" },
  { key: "camera", label: "Camera" },
  { key: "lighting", label: "Lighting" },
  { key: "action", label: "Action" },
  { key: "dialogue", label: "Dialogue / VO" },
  { key: "sound", label: "Sound" },
  { key: "transition", label: "Transition" },
] as const;

/**
 * One scene: its script on the left, the media attached to it on the right.
 *
 * Read-only. The per-scene edit, regenerate, duplicate and delete controls have
 * been removed, so the only things you do from here are switch take and step to a
 * neighbouring beat — both on the top row rather than under the content.
 */
export function ScenePanel({
  track,
  index,
  prevBeat,
  nextBeat,
  aspectClass,
  onStep,
  onActivateVersion,
}: {
  track: SceneTrack;
  index: number;
  /** The beats either side, for the step buttons' labels. Absent at the ends. */
  prevBeat?: string;
  nextBeat?: string;
  /** Matches the session's aspect ratio, so a media tile is the shape of the output. */
  aspectClass: string;
  onStep: (delta: -1 | 1) => void;
  onActivateVersion: (versionIndex: number) => void;
}) {
  const scene = activeScene(track);

  return (
    <div
      data-slot="scene-panel"
      className="@container rounded-xl border border-border/60 bg-card/40 p-3.5"
    >
      {/* Take switching leads, because it is the thing you came here to compare.
          Beat stepping trails it — same row, so the panel opens on content rather
          than on a bar of controls. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VersionList
          entries={track.versions.map((version, versionIndex) => ({
            id: String(versionIndex),
            label: `Take ${versionIndex + 1}`,
            preview: version.visual,
          }))}
          activeId={String(track.activeIndex)}
          onActivate={(id) => onActivateVersion(Number(id))}
        />

        {/* Selects the neighbouring beat rather than reordering anything — a faster
            way through the tab row than aiming at each tab. The destination beat is
            named, so the buttons say where they go instead of just "next". */}
        <span className="flex shrink-0 items-center gap-1.5">
          <StepButton
            label="Previous scene"
            beat={prevBeat}
            Icon={ArrowLeft}
            onClick={() => onStep(-1)}
          />
          <StepButton
            label="Next scene"
            beat={nextBeat}
            Icon={ArrowRight}
            onClick={() => onStep(1)}
          />
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-5">
        {/*
          The script in two columns, then the media across the full width below it.

          One list, split by `grid-flow-col` over four rows rather than two hand-cut
          halves: the flow fills column one downwards before starting column two, so
          Duration→Lighting and Action→Transition fall out of the field order itself
          and cannot drift from it. Below the threshold it collapses back to one stack.

          Container queries, not viewport ones: this sits inside the workspace column,
          which is a fraction of the window, so `lg:` fired while the panel was still
          too narrow to hold two columns.

          40rem rather than the `@2xl` step (42rem), measured rather than guessed: on a
          1180px window this panel's content box is 651px, which missed 42rem by 21px
          and stacked. 40rem still leaves each value column ~210px, which is the point
          below which this prose starts wrapping every other word.
        */}
        <dl className="grid gap-x-6 gap-y-3 @min-[40rem]:grid-flow-col @min-[40rem]:grid-rows-4">
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className="grid min-w-0 grid-cols-[5.5rem_1fr] items-start gap-3"
            >
              <dt className="pt-px text-xs text-muted-foreground">{field.label}</dt>
              <dd
                // Stable hook for "switching take changed this scene and no other".
                data-slot={field.key === "visual" ? "scene-visual" : undefined}
                // `break-words` because the column is narrow and prompt text carries
                // long unbroken strings (lens names, hex values).
                className="text-xs leading-relaxed break-words text-foreground/85"
              >
                {String(scene[field.key]) || (
                  <span className="text-muted-foreground">—</span>
                )}
                {"suffix" in field && field.suffix ? field.suffix : ""}
              </dd>
            </div>
          ))}
        </dl>

        <SceneMedia beat={track.beat} index={index} aspectClass={aspectClass} />
      </div>
    </div>
  );
}

/**
 * The media attached to this scene, on its own row under the script.
 *
 * Two stand-in stills plus a slot to add more. Scrolls horizontally rather than
 * wrapping, so the panel's height stays put as the aspect ratio changes and as tiles
 * are added — a row that reflowed would move everything below it.
 */
function SceneMedia({
  beat,
  index,
  aspectClass,
}: {
  beat: string;
  index: number;
  aspectClass: string;
}) {
  // Keyed off the scene's position, so each beat shows a different pair and keeps
  // it across re-renders. Same placeholder art the Asset Library resolves to.
  const stills = [placeholderFor(index), placeholderFor(index + 1)];

  return (
    <section className="min-w-0">
      <h4 className="text-xs text-muted-foreground">Media</h4>

      {/* `py-1 -my-1`: `overflow-x` clips vertically at the padding edge, which
          would otherwise shave the focus ring off the top and bottom of each tile. */}
      <div
        data-slot="scene-media"
        className="scrollbar-slim -my-1 mt-2 flex gap-2 overflow-x-auto py-1"
      >
        <button
          type="button"
          // TODO: opens the media picker once the Asset Library can hand one over.
          aria-label={`Add media to the ${beat}`}
          className={cn(
            "grid w-24 shrink-0 place-items-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground",
            "transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
            aspectClass,
          )}
        >
          <span className="px-1 text-center">
            <ImagePlus aria-hidden className="mx-auto size-4" />
            <span className="mt-1 block text-[10px] leading-tight">Add media</span>
          </span>
        </button>

        {stills.map((src, index) => (
          <figure
            key={src}
            className={cn(
              "relative w-24 shrink-0 overflow-hidden rounded-lg border border-border/60",
              aspectClass,
            )}
          >
            <Image
              src={src}
              alt={`${beat} reference ${index + 1}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}

function StepButton({
  label,
  beat,
  Icon,
  onClick,
}: {
  label: string;
  /** Absent means there is no beat that way, so the button is spent. */
  beat?: string;
  Icon: typeof ArrowLeft;
  onClick: () => void;
}) {
  const name = beat ? `${label}: ${beat}` : label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!beat}
      // Icon-only still needs an accessible name, and a tooltip for sighted users.
      aria-label={name}
      title={name}
      className={cn(
        "grid size-7 place-items-center rounded-lg border border-border/70 text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:opacity-40 disabled:hover:bg-transparent",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
