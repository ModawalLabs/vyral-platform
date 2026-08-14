"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";

import { ASPECT_CLASS } from "@/components/create/aspect";
import { useSession } from "@/components/create/session-provider";
import { cn } from "@/lib/utils";
import type { SceneTrack } from "@/types/session";

/**
 * The selected scenes, written into the conversation.
 *
 * Part of the chat rather than a panel beside it: this is the director showing you
 * what you just pointed at, so it belongs in the same column as everything else it
 * says. It is aligned and styled like a director turn for that reason.
 *
 * Live, not a posted message. It reflects the current selection and leaves when the
 * selection is emptied, because appending a message on every tick would bury the
 * actual conversation under a running commentary of checkbox state. That is also why
 * it renders after the message list instead of inside it — it has no place in the
 * history.
 */
export function SelectedScenes() {
  const { tracks, selectedSceneIds } = useSession();
  const selected = tracks.filter((track) => selectedSceneIds.has(track.id));

  if (selected.length === 0) return null;

  return (
    <div data-slot="selected-scenes" className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {selected.length === 1
          ? "1 scene selected"
          : `${selected.length} scenes selected`}
      </p>

      {selected.map((track) => (
        <SceneCard
          key={track.id}
          track={track}
          // Numbered by position in the cut, not by position in the selection —
          // "Scene 3" has to mean the same thing here as it does in the picker.
          index={tracks.indexOf(track)}
        />
      ))}

      {/*
        The director picking the conversation back up, so the cards hand off to the
        composer rather than just sitting there.

        Styled as a director turn — same size, weight and colour as the plain-text
        lines above — because that is what it is. It is not a posted message for the
        same reason the cards are not: it belongs to the current selection and leaves
        with it, and re-asking on every tick would fill the history with the question.
      */}
      <p
        data-slot="selected-scenes-prompt"
        className="pt-1 text-sm leading-relaxed text-foreground/90"
      >
        What would you like to edit?
      </p>
    </div>
  );
}

function SceneCard({ track, index }: { track: SceneTrack; index: number }) {
  const { settings, activateSceneVersion, addSceneMedia, removeSceneMedia } =
    useSession();
  const scene = track.versions[track.activeIndex];
  const aspect = ASPECT_CLASS[settings.aspectRatio];

  return (
    <section
      data-slot="selected-scene"
      aria-label={`Scene ${index + 1}, ${track.beat}`}
      className="rounded-xl border border-border/60 bg-card/40 p-3"
    >
      <div className="flex items-baseline gap-2">
        <h3 className="text-xs font-semibold">Scene {index + 1}</h3>
        <span className="text-[11px] text-muted-foreground">{track.beat}</span>
        {/* Reads off the active take, so switching version below changes it. */}
        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
          {scene.durationSeconds}s
        </span>
      </div>

      <p className="mt-1 truncate text-[11px] text-muted-foreground">{scene.visual}</p>

      <Row label="Versions">
        {track.versions.map((_version, versionIndex) => {
          const isActive = versionIndex === track.activeIndex;
          return (
            <button
              // Keyed by position, not by `version.id` — every take of a track shares
              // one scene id on purpose (see `Scene.id`), so keying on it collides.
              // Safe here because versions are append-only: never reordered, never
              // removed, so a position always means the same take.
              key={versionIndex}
              type="button"
              onClick={() => activateSceneVersion(track.id, versionIndex)}
              // The pressed pattern, not a checkbox: exactly one take is live at a
              // time, and the control both reports and sets which.
              aria-pressed={isActive}
              aria-label={`Take ${versionIndex + 1} of scene ${index + 1}`}
              className={cn(
                "h-6 rounded-md px-2 text-[11px] font-semibold tabular-nums transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "border border-border/70 text-muted-foreground hover:border-brand/40 hover:text-foreground",
              )}
            >
              v{versionIndex + 1}
            </button>
          );
        })}
      </Row>

      <Row label="Media">
        {/*
          `py-1 -my-1` on the scroller, same as the Screenplay tab's media row:
          `overflow-x` clips vertically at the padding edge and would otherwise shave
          the focus ring off the top and bottom of every tile.
        */}
        <div
          data-slot="selected-scene-media"
          className="scrollbar-slim -my-1 flex min-w-0 gap-1.5 overflow-x-auto py-1"
        >
          <button
            type="button"
            onClick={() => addSceneMedia(track.id)}
            aria-label={`Add media to scene ${index + 1}`}
            title="Add media"
            className={cn(
              "grid w-20 shrink-0 place-items-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground",
              "transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
              aspect,
            )}
          >
            <ImagePlus aria-hidden className="size-4" />
          </button>

          {track.media.map((item, mediaIndex) => (
            // `group` so the remove button can appear on hover of the tile rather
            // than sitting on every thumbnail permanently.
            <div
              key={item.id}
              className={cn(
                "group/tile relative w-20 shrink-0 overflow-hidden rounded-lg border border-border/60",
                aspect,
              )}
            >
              <Image
                src={item.url}
                alt={`${track.beat} reference ${mediaIndex + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />

              {/*
                Always in the DOM and focusable, only *visually* revealed on hover —
                `hidden` until hover would put it out of reach of the keyboard
                entirely, so `focus-visible` brings it back too.
              */}
              <button
                type="button"
                onClick={() => removeSceneMedia(track.id, item.id)}
                aria-label={`Remove reference ${mediaIndex + 1} from scene ${index + 1}`}
                title="Remove"
                className={cn(
                  "absolute top-1 right-1 grid size-5 place-items-center rounded-md",
                  "bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity",
                  "group-hover/tile:opacity-100 hover:bg-background focus-visible:opacity-100",
                  "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                )}
              >
                <X aria-hidden className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </Row>
    </section>
  );
}

/** A labelled line. The label column is fixed so the rows align down the card. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}
