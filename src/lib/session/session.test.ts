import { describe, expect, it } from "vitest";

import { coverageByBeat, missingAssetCount } from "@/lib/session/assets";
import { changedSettings, revisionSummary } from "@/lib/session/brief";
import { aspectWarning, deriveRationale } from "@/lib/session/models";
import { nextProgress } from "@/lib/session/render";
import {
  durationState,
  initialScenes,
  initialTracks,
  regenerateScene,
  reorder,
  totalDuration,
} from "@/lib/session/scenes";
import { STORY_VARIANTS, nextStoryVariant } from "@/lib/session/story";
import type { Asset, SessionSettings } from "@/types/session";

const settings = (patch: Partial<SessionSettings> = {}): SessionSettings => ({
  model: "Veo3",
  durationSeconds: 10,
  aspectRatio: "16:8",
  platform: "Instagram Reel",
  resolution: "1080p",
  ...patch,
});

describe("deriveRationale", () => {
  it("rewrites when the model changes", () => {
    const veo = deriveRationale(settings());
    const seedance = deriveRationale(settings({ model: "Seedance" }));
    expect(seedance).not.toEqual(veo);
  });

  it("tracks duration in the cost line", () => {
    const short = deriveRationale(settings({ durationSeconds: 5 }));
    const long = deriveRationale(settings({ durationSeconds: 15 }));
    expect(short.some((line) => line.includes("20 credits"))).toBe(true);
    expect(long.some((line) => line.includes("60 credits"))).toBe(true);
  });

  it("says whether the model can speak the CTA", () => {
    expect(deriveRationale(settings()).some((l) => l.includes("synced dialogue"))).toBe(
      true,
    );
    expect(
      deriveRationale(settings({ model: "Seedance" })).some((l) =>
        l.includes("No dialogue support"),
      ),
    ).toBe(true);
  });
});

describe("aspectWarning", () => {
  it("warns when a vertical platform gets a landscape frame", () => {
    expect(aspectWarning(settings({ platform: "Instagram Reel" }))).toContain(
      "vertical placement",
    );
    expect(aspectWarning(settings({ platform: "TikTok" }))).not.toBeNull();
  });

  it("stays quiet when the frame matches, or the platform does not care", () => {
    expect(aspectWarning(settings({ aspectRatio: "8:16" }))).toBeNull();
    expect(aspectWarning(settings({ platform: "YouTube" }))).toBeNull();
  });
});

describe("regenerateScene", () => {
  it("returns a different take on the same beat", () => {
    const [hook] = initialScenes();
    const next = regenerateScene(hook);
    expect(next.beat).toBe(hook.beat);
    expect(next.visual).not.toBe(hook.visual);
    expect(next.id).toBe(hook.id);
  });

  it("leaves every other scene untouched — by reference", () => {
    // The guarantee the Screenplay demo is built on, so it is asserted on
    // identity rather than equality.
    const scenes = initialScenes();
    const regenerated = scenes.map((scene) =>
      scene.id === scenes[0].id ? regenerateScene(scene) : scene,
    );
    expect(regenerated[0]).not.toBe(scenes[0]);
    for (let i = 1; i < scenes.length; i++) {
      expect(regenerated[i]).toBe(scenes[i]);
    }
  });

  it("keeps cycling on repeated presses", () => {
    const [hook] = initialScenes();
    const once = regenerateScene(hook);
    const twice = regenerateScene(once);
    expect(twice.visual).not.toBe(once.visual);
  });
});

describe("initialTracks", () => {
  /*
   * The consequence of `Scene.id` identifying the scene rather than the take: every
   * version of a track carries the same id, so a version list keyed on it collides.
   *
   * Asserted here and not only on `regenerateScene` because this is the shape the UI
   * actually renders, and rendering it with `key={version.id}` is exactly the mistake
   * this locks down.
   */
  it("gives every take of a track the same scene id", () => {
    for (const track of initialTracks()) {
      const ids = new Set(track.versions.map((version) => version.id));
      expect(track.versions.length).toBeGreaterThan(1);
      expect([...ids]).toEqual([track.id]);
    }
  });

  it("seeds media on the track, so it survives a take switch", () => {
    for (const track of initialTracks()) {
      expect(track.media).toHaveLength(2);
      // Ids, not bare urls: the same art can be attached twice and still be
      // removed one tile at a time.
      expect(new Set(track.media.map((item) => item.id)).size).toBe(2);
    }
  });
});

describe("durationState", () => {
  it("reports over, under and on target without hiding any of them", () => {
    const scenes = initialScenes();
    const total = totalDuration(scenes);
    expect(durationState(scenes, total).state).toBe("on");
    expect(durationState(scenes, total - 3)).toMatchObject({ state: "over", delta: 3 });
    expect(durationState(scenes, total + 4)).toMatchObject({ state: "under", delta: -4 });
  });
});

describe("reorder", () => {
  it("moves an item and leaves the array otherwise intact", () => {
    expect(reorder(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorder(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("is a no-op for a move that goes nowhere or out of range", () => {
    const items = ["a", "b"];
    expect(reorder(items, 1, 1)).toBe(items);
    expect(reorder(items, 0, 9)).toBe(items);
  });
});

describe("nextStoryVariant", () => {
  it("never returns the variant already showing", () => {
    for (let i = 0; i < STORY_VARIANTS.length; i++) {
      expect(nextStoryVariant(i)).not.toBe(i);
    }
  });
});

describe("changedSettings", () => {
  it("is empty when nothing moved", () => {
    expect(changedSettings(settings(), settings())).toEqual([]);
  });

  it("names every field that differs", () => {
    const before = settings();
    const after = settings({ model: "Kling", durationSeconds: 12 });
    expect(changedSettings(before, after)).toEqual(["Model", "Duration"]);
  });

  it("reports in a stable order regardless of which changed", () => {
    const all = changedSettings(
      settings(),
      settings({
        model: "Kling",
        platform: "TikTok",
        aspectRatio: "8:16",
        durationSeconds: 5,
      }),
    );
    expect(all).toEqual(["Model", "Platform", "Aspect ratio", "Duration"]);
  });
});

describe("revisionSummary", () => {
  it("mentions only the prose when only the prose moved", () => {
    const line = revisionSummary(2, true, []);
    expect(line).toContain("revision 2");
    expect(line).toContain("the prose");
    expect(line).not.toContain("settings");
    // Prose-only leaves the screenplay's structure alone, and says so.
    expect(line).toContain("still lines up");
  });

  it("names changed settings and warns that downstream follows", () => {
    const line = revisionSummary(3, false, ["Aspect ratio"]);
    expect(line).toContain("aspect ratio");
    expect(line).not.toContain("the prose");
    expect(line).toContain("render queue");
  });

  it("joins both halves when both moved", () => {
    expect(revisionSummary(4, true, ["Model"])).toContain("the prose and model");
  });
});

describe("coverage", () => {
  const asset = (patch: Partial<Asset>): Asset => ({
    id: "a",
    kind: "characters",
    label: "Courier",
    status: "empty",
    sceneBeats: ["Hook"],
    ...patch,
  });

  it("counts a beat as covered only when its assets are ready", () => {
    const scenes = initialScenes();
    const [hook] = coverageByBeat([asset({ status: "empty" })], scenes);
    expect(hook.missing).toEqual(["Courier"]);

    const [ready] = coverageByBeat([asset({ status: "ready" })], scenes);
    expect(ready.missing).toEqual([]);
  });

  it("treats generating and failed as not ready", () => {
    expect(missingAssetCount([asset({ status: "generating" })])).toBe(1);
    expect(missingAssetCount([asset({ status: "failed" })])).toBe(1);
    expect(missingAssetCount([asset({ status: "ready" })])).toBe(0);
  });
});

describe("nextProgress", () => {
  it("sprints to 70, crawls to 95, then holds", () => {
    // A linear bar is the tell that nothing is really happening.
    let value = 0;
    let ticksTo70 = 0;
    while (value < 70) {
      value = nextProgress(value);
      ticksTo70++;
    }

    let ticksTo95 = 0;
    while (value < 95) {
      value = nextProgress(value);
      ticksTo95++;
    }

    expect(ticksTo95).toBeGreaterThan(ticksTo70);
    // Never completes on its own — only the job landing sets 100.
    expect(nextProgress(95)).toBe(95);
  });
});
