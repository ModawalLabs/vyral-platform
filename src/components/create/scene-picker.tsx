"use client";

import { Check, ChevronDown, Clapperboard } from "lucide-react";

import { GLASS_SURFACE } from "@/components/create/glass";
import { useSession } from "@/components/create/session-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Scene multi-select, sitting on the chat composer.
 *
 * The selection lives in the session, because this control is only half of the
 * feature: `SelectedScenes` reads the same set and writes a card per selected scene
 * into the foot of the conversation, where the scene's takes and attached media can
 * be changed. Neither component contains the other, so neither can hold the state.
 *
 * Selecting still does not aim the *director* at anything — no message is tagged with
 * it and nothing downstream reads it.
 *
 * TODO: when the director can be aimed at part of the cut, tag the outgoing message
 * with `selectedSceneIds`.
 */
export function ScenePicker() {
  const {
    tracks,
    scenes,
    selectedSceneIds: selected,
    toggleSceneSelected: toggle,
    setSelectedScenes,
  } = useSession();

  const allSelected = selected.size === tracks.length;

  return (
    <Popover>
      {/*
        The pill's text stays "Scenes" whatever is selected, with the count as a
        separate chip. A label that became "3 scenes" would change the button's
        accessible name every time you ticked a row, so a screen reader would hear the
        control rename itself rather than hear a count change.
      */}
      <PopoverTrigger
        className={cn(
          "group/pill relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border py-1.5 pr-2.5 pl-3",
          "text-xs font-medium text-muted-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          GLASS_SURFACE,
          /*
             The purple glow, after `GLASS_SURFACE` so it wins the border: that constant
             re-asserts the glass border on hover, and tailwind-merge keeps the last
             `border-*` of a group, so anything tinting the edge has to come after it.

             Two shadows rather than one — a tight ring to draw the edge and a wide
             bloom to light the surface behind it. A single large shadow at an opacity
             strong enough to be seen reads as a drop shadow rather than as emitted
             light.

             The strength rides on `--glow` so hover and open restate one number rather
             than a whole two-layer shadow each, and the declaration stays single and
             transitionable. `shadow-brand/35` would also compose with an arbitrary
             multi-shadow value — the settings panels do exactly that — but changing its
             alpha per state means repeating the full value in every variant.
          */
          "border-brand/40 hover:border-brand/65 aria-expanded:border-brand/65",
          "[--glow:32%] hover:[--glow:60%] aria-expanded:[--glow:60%]",
          "shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_var(--glow),transparent),0_0_20px_-2px_color-mix(in_oklab,var(--brand)_var(--glow),transparent)]",
          "transition-[color,box-shadow,border-color] duration-300",
          "hover:text-foreground aria-expanded:text-foreground",
        )}
      >
        {/* Brand light pooling up from the lower edge, inside the glass. The shadows
            above light the pill from outside; this is what makes it look lit from
            within rather than merely outlined. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-brand/40 blur-lg"
        />
        {/* Specular line along the top bevel — the one detail that reads as a rounded
            edge catching light rather than a flat translucent chip. `inset-x-3` so it
            fades out before the pill's own curve, where a full-width line would cut
            across the corner. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-glass-sheen to-transparent"
        />
        <Clapperboard aria-hidden className="size-3.5 opacity-70" />
        Scenes
        {selected.size > 0 ? (
          <span className="rounded-full bg-brand/15 px-1.5 text-[11px] font-semibold text-brand-text tabular-nums">
            {selected.size}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden
          className="size-3 opacity-60 transition-transform duration-200 group-aria-expanded/pill:rotate-180"
        />
      </PopoverTrigger>

      {/* Opens upward: the composer is pinned to the bottom of the screen, so a
          downward panel would have nowhere to go. */}
      <PopoverContent side="top" align="start" sideOffset={8} className="w-[19rem] p-1.5">
        <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Scenes
          </span>
          {/* One button that flips, rather than a Select all / Clear pair: with five
              rows either action is one click away regardless, and two controls in a
              1.5rem header row is more chrome than the list itself. */}
          <button
            type="button"
            onClick={() =>
              setSelectedScenes(allSelected ? [] : tracks.map((track) => track.id))
            }
            className="rounded px-1 text-[11px] font-medium text-brand-text transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            {allSelected ? "Clear" : "Select all"}
          </button>
        </div>

        <div
          role="group"
          aria-label="Scenes"
          data-slot="scene-picker-list"
          className="mt-1 flex flex-col"
        >
          {tracks.map((track, index) => {
            // Same order as `tracks` — `scenes` is `tracks.map(activeScene)`.
            const scene = scenes[index];
            const isOn = selected.has(track.id);

            return (
              <button
                key={track.id}
                type="button"
                // A button carrying the checkbox role: the state is what matters here
                // and there is no form to post it to. Space and Enter both toggle it,
                // which is what a native checkbox does anyway.
                role="checkbox"
                aria-checked={isOn}
                onClick={() => toggle(track.id)}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isOn ? "bg-brand/10" : "hover:bg-muted/60",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-px grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                    isOn
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border/80",
                  )}
                >
                  {isOn ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium">Scene {index + 1}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {track.beat}
                    </span>
                  </span>
                  {/* The one line that tells two scenes apart at a glance. Truncated
                      rather than wrapped so every row is the same height and the list
                      stays a list. */}
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {scene?.visual}
                  </span>
                </span>

                <span className="mt-px shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {scene?.durationSeconds}s
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
