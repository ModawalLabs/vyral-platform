import { placeholderFor } from "@/lib/session/assets";
import {
  BEATS,
  type Beat,
  type Scene,
  type SceneMedia,
  type SceneTrack,
} from "@/types/session";

let sceneCounter = 0;
/** Monotonic rather than random, so ids stay stable under React's strict double-invoke. */
export const nextSceneId = () => `sc_${(sceneCounter += 1)}`;

let mediaCounter = 0;
const nextMediaId = () => `md_${(mediaCounter += 1)}`;

/** Wrap placeholder art as an attachable tile. The only way media is minted. */
export const makeSceneMedia = (index: number): SceneMedia => ({
  id: nextMediaId(),
  url: placeholderFor(index),
});

const BEAT_SEEDS: Record<Beat, Omit<Scene, "id" | "beat">> = {
  Hook: {
    durationSeconds: 2,
    visual: "Rain-slicked alley, neon reflected in a puddle",
    camera: "Low tracking shot, 24mm, pushing in",
    lighting: "Hard magenta key from a sign, deep shadows",
    action: "A cyclist cuts through frame, spray lifting behind",
    dialogue: "",
    sound: "Tyre hiss, distant bass",
    transition: "Hard cut",
  },
  Problem: {
    durationSeconds: 2,
    visual: "Rider slows, checks a dead phone screen",
    camera: "Handheld medium, slight tilt",
    lighting: "Cool ambient, screen glow on the face",
    action: "Phone goes dark, rider exhales",
    dialogue: "",
    sound: "Rain steadies, music drops out",
    transition: "Dip to black",
  },
  Solution: {
    durationSeconds: 3,
    visual: "Product lights up in a gloved hand",
    camera: "Macro, shallow depth, slow rack focus",
    lighting: "Warm practical from the device itself",
    action: "Interface wakes, route redraws",
    dialogue: "",
    sound: "Soft chime, music returns",
    transition: "Match cut on the light",
  },
  Lifestyle: {
    durationSeconds: 2,
    visual: "Rider rejoins traffic, city opening up ahead",
    camera: "Drone pull-back, rising",
    lighting: "Golden practicals against blue hour",
    action: "Confident acceleration into the lane",
    dialogue: "",
    sound: "Full music bed",
    transition: "Cross dissolve",
  },
  CTA: {
    durationSeconds: 1,
    visual: "Logo over the wet street, type settling",
    camera: "Locked off",
    lighting: "Single rim from the left",
    action: "Wordmark resolves, tagline fades up",
    dialogue: "",
    sound: "Final hit, tail out",
    transition: "Hold",
  },
};

/** Alternates a regenerated scene can land on, keyed by beat. */
const REGEN_VISUALS: Record<Beat, string[]> = {
  Hook: [
    "Overhead of the alley, rain sheeting through a shaft of light",
    "Whip-pan off a flickering sign onto the rider",
    "Reflection-only opening — the whole shot in a puddle",
  ],
  Problem: [
    "Rider stalls at a junction, map unreadable",
    "Close on a hand wiping rain off a dead screen",
    "Wide of the rider dwarfed by an unlit intersection",
  ],
  Solution: [
    "Device wakes, casting light up the rider's jacket",
    "Overhead of the route redrawing across wet tarmac",
    "Slow orbit around the product as it comes alive",
  ],
  Lifestyle: [
    "Rider threads a lit boulevard, city reflected in the visor",
    "Low chase shot as the bike accelerates away",
    "Rooftop wide, one moving light through the grid",
  ],
  CTA: [
    "Wordmark forming out of the neon reflections",
    "Type over a locked-off shot of the empty street",
    "Logo carved by a passing headlight",
  ],
};

export function initialScenes(): Scene[] {
  return BEATS.map((beat) => ({ id: nextSceneId(), beat, ...BEAT_SEEDS[beat] }));
}

/**
 * Each beat as a track with two takes.
 *
 * Two rather than one so the take switcher has something to switch to from the
 * start. Take 2 is derived through `regenerateScene` rather than hand-written, so
 * it stays in step with the seeds above and is visibly a different take instead of
 * a reworded one. Take 1 stays active — it is the seed the rest of the mock copy
 * was written against.
 *
 * The two seeded stills per beat are the pair the Screenplay tab used to derive from
 * the scene's position. They are state now, so they can be added to and removed.
 */
export function initialTracks(): SceneTrack[] {
  return initialScenes().map((scene, index) => ({
    id: scene.id,
    beat: scene.beat,
    versions: [scene, regenerateScene(scene)],
    activeIndex: 0,
    media: [makeSceneMedia(index), makeSceneMedia(index + 1)],
  }));
}

/** The version currently in play. Everything downstream reads through this. */
export const activeScene = (track: SceneTrack) => track.versions[track.activeIndex];

/**
 * Append a version and make it current.
 *
 * Appending rather than replacing is what makes an edit reversible; the newer
 * versions of *other* tracks are untouched because only this track is rebuilt.
 */
export function pushVersion(track: SceneTrack, scene: Scene): SceneTrack {
  const versions = [...track.versions, scene];
  return { ...track, versions, activeIndex: versions.length - 1 };
}

/**
 * A different take on one scene.
 *
 * Returns a new object and touches nothing else — the guarantee the Screenplay
 * demo is built on. `avoid` keeps a second press from landing on the same line.
 */
export function regenerateScene(scene: Scene): Scene {
  const options = REGEN_VISUALS[scene.beat];
  const current = options.indexOf(scene.visual);
  const visual = options[(current + 1 + options.length) % options.length];

  return {
    ...scene,
    visual,
    // A regeneration that only swapped one line would not read as a new take.
    camera:
      CAMERA_VARIANTS[(current + 1 + CAMERA_VARIANTS.length) % CAMERA_VARIANTS.length],
    durationSeconds: Math.max(
      1,
      Math.min(6, scene.durationSeconds + (current % 2 ? -1 : 1)),
    ),
  };
}

const CAMERA_VARIANTS = [
  "Low tracking shot, 24mm, pushing in",
  "Handheld medium, slight tilt",
  "Slow dolly, 50mm, shallow",
  "Locked off, wide",
];

export const totalDuration = (scenes: Scene[]) =>
  scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

/**
 * How the running total compares with the target. `over` and `under` are both
 * surfaced, never enforced — the user is told, not stopped.
 */
export function durationState(scenes: Scene[], target: number) {
  const total = totalDuration(scenes);
  const delta = total - target;
  return {
    total,
    delta,
    state:
      delta === 0 ? ("on" as const) : delta > 0 ? ("over" as const) : ("under" as const),
  };
}

/** Move an item within an array, returning a new one. */
export function reorder<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
