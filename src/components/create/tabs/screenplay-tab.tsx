"use client";

import { useState } from "react";

import { ASPECT_CLASS } from "@/components/create/aspect";
import { ScenePanel } from "@/components/create/scene-panel";
import { useSession } from "@/components/create/session-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeScene } from "@/lib/session/scenes";

/** Spoken form for the tab's accessible name. The CTA beat really is 1 second. */
const seconds = (value: number) => `${value} second${value === 1 ? "" : "s"}`;

/**
 * The five beats, as a tab set.
 *
 * One scene at a time rather than five stacked accordions: a scene has eight
 * fields and a clip slot, and the interesting comparison is between takes of the
 * same beat, not between beats. The tab row doubles as the running order.
 */
export function ScreenplayTab() {
  const { tracks, settings, activateSceneVersion } = useSession();

  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Falls back rather than dangling.
   *
   * Deleting the open scene would leave `value` pointing at a tab that no longer
   * exists and the panel area blank. Resolving it here instead of syncing state in
   * an effect keeps the fallback immediate and the render pure.
   */
  const active = tracks.some((track) => track.id === selected)
    ? selected!
    : (tracks[0]?.id ?? "");

  if (tracks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Every scene has been deleted. Regenerate the story to rebuild the beats.
      </p>
    );
  }

  return (
    <Tabs
      value={active}
      onValueChange={(value) => setSelected(value as string)}
      className="gap-3"
    >
      {/* Scrolls rather than cramping: five beats plus their durations do not fit
          this column on a laptop, and shrinking them to fit is how a tab row stops
          being readable. */}
      <TabsList
        variant="line"
        className="no-scrollbar w-full shrink-0 justify-start gap-1 overflow-x-auto"
      >
        {tracks.map((track, index) => (
          <TabsTrigger
            key={track.id}
            value={track.id}
            // Spelled out, because the visible parts are three separate spans and
            // concatenate to "01Hook2s" for anything reading the accessible name.
            aria-label={`Scene ${index + 1}, ${track.beat}, ${seconds(activeScene(track).durationSeconds)}`}
            className="flex-none gap-2 px-3 py-1.5"
          >
            <span className="text-[11px] tabular-nums opacity-60">
              {String(index + 1).padStart(2, "0")}
            </span>
            {track.beat}
            <span className="rounded-full border border-border/60 px-1.5 text-[10px] tabular-nums">
              {activeScene(track).durationSeconds}s
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tracks.map((track, index) => (
        <TabsContent
          key={track.id}
          value={track.id}
          // Kept mounted so each scene holds its own draft: without this, starting
          // an edit and glancing at another beat discards the edit silently.
          keepMounted
        >
          <ScenePanel
            track={track}
            prevBeat={tracks[index - 1]?.beat}
            nextBeat={tracks[index + 1]?.beat}
            aspectClass={ASPECT_CLASS[settings.aspectRatio]}
            onStep={(delta) => {
              const target = tracks[index + delta];
              if (target) setSelected(target.id);
            }}
            onActivateVersion={(versionIndex) =>
              activateSceneVersion(track.id, versionIndex)
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
