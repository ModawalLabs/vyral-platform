"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { placeholderFor, initialAssets } from "@/lib/session/assets";
import { changedSettings, revisionSummary } from "@/lib/session/brief";
import { deriveRationale } from "@/lib/session/models";
import {
  FAILING_SCENE_INDEX,
  RENDER_CONCURRENCY,
  RENDER_ERROR,
  RENDER_MS_MAX,
  RENDER_MS_MIN,
  nextProgress,
} from "@/lib/session/render";
import {
  activeScene,
  initialTracks,
  makeSceneMedia,
  nextSceneId,
  pushVersion,
  regenerateScene,
  reorder,
  totalDuration,
} from "@/lib/session/scenes";
import { STORY_VARIANTS } from "@/lib/session/story";
import type {
  Asset,
  ChatMessage,
  RenderJob,
  Scene,
  SceneTrack,
  SessionSettings,
  Story,
  StoryVersion,
} from "@/types/session";

let versionCounter = 0;
const nextVersionId = () => `ver_${(versionCounter += 1)}`;

type SessionValue = {
  prompt: string;
  /** Read-only: the active revision owns these. Change them via `saveRevision`. */
  settings: SessionSettings;
  rationale: string[];

  story: Story;
  activeStory: StoryVersion;
  /** Appends a revision carrying both the prose and the settings. */
  saveRevision: (text: string, settings: SessionSettings) => void;
  activateStoryVersion: (id: string) => void;

  /**
   * Whether the screenplay has been sent to generate, which is what reveals the
   * test screening.
   *
   * Session state rather than the brief tab's own: `TabsContent` unmounts the panel
   * on a tab switch, so a local flag would be lost the moment you glanced at the
   * Asset Library and came back.
   */
  scenesGenerated: boolean;
  generateScenes: () => void;

  /**
   * Whether the final render has been asked for, which is what puts the final
   * production card above the conversation.
   *
   * Session state for the same reason as `scenesGenerated`, and more so: the button
   * that sets it lives in the brief tab, which unmounts on a tab switch, while the
   * card it reveals lives in the director column, which does not. Nothing local to
   * either could join those two up.
   */
  finalProductionStarted: boolean;
  startFinalProduction: () => void;

  /** Tracks carry the history; `scenes` is the active version of each. */
  tracks: SceneTrack[];
  scenes: Scene[];

  /**
   * Which scenes the composer's picker has selected, by track id.
   *
   * Session state because two separate places in the director column read it: the
   * pill above the composer, and the detail cards at the end of the conversation.
   * Neither owns the other, so neither can own the selection.
   */
  selectedSceneIds: ReadonlySet<string>;
  toggleSceneSelected: (trackId: string) => void;
  setSelectedScenes: (trackIds: string[]) => void;

  /** Attach or drop a reference still. Both act on the track, not the active take. */
  addSceneMedia: (trackId: string) => void;
  removeSceneMedia: (trackId: string, mediaId: string) => void;

  updateScene: (id: string, patch: Partial<Scene>) => void;
  duplicateScene: (id: string) => void;
  deleteScene: (id: string) => void;
  regenerateOneScene: (id: string) => void;
  moveScene: (from: number, to: number) => void;
  activateSceneVersion: (trackId: string, index: number) => void;

  assets: Asset[];
  generateAsset: (id: string) => void;
  uploadAsset: (id: string, file: File) => void;
  reuseAsset: (id: string) => void;

  renders: RenderJob[];
  rendering: boolean;
  startRender: () => void;
  retryScene: (sceneId: string) => void;

  messages: ChatMessage[];
};

const SessionContext = createContext<SessionValue | null>(null);

let messageCounter = 0;
const nextMessageId = () => `msg_${(messageCounter += 1)}`;

/**
 * All session state, in one place.
 *
 * The tabs are not independent: editing the story posts to the chat, asset gaps
 * warn on the Generate button, and render progress writes status lines back
 * into the conversation. Threading that through props would couple every tab to
 * every other, so it lives here and each tab takes the slice it needs.
 *
 * Everything is mocked. Timers stand in for the API; the shapes are what the
 * real thing will return.
 */
export function SessionProvider({
  prompt,
  settings: initialSettings,
  children,
}: {
  prompt: string;
  settings: SessionSettings;
  children: ReactNode;
}) {
  const [story, setStory] = useState<Story>(() => {
    const first: StoryVersion = {
      id: nextVersionId(),
      revision: 1,
      text: STORY_VARIANTS[0],
      variant: 0,
      settings: initialSettings,
    };
    return { versions: [first], activeId: first.id };
  });
  const [tracks, setTracks] = useState<SceneTrack[]>(initialTracks);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [renders, setRenders] = useState<RenderJob[]>([]);
  const [rendering, setRendering] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextMessageId(), from: "user", text: prompt },
    {
      id: nextMessageId(),
      from: "director",
      text: "I've drafted a story and broken it into five beats. Take a look at the Production Workspace — edit anything there and I'll keep the rest in step.",
    },
  ]);

  const say = useCallback((text: string) => {
    setMessages((current) => [
      ...current,
      { id: nextMessageId(), from: "director", text },
    ]);
  }, []);

  /* ------------------------------------------------------- brief (story + settings) */

  const activeStory = useMemo(
    () =>
      story.versions.find((version) => version.id === story.activeId) ??
      story.versions[story.versions.length - 1],
    [story],
  );

  /**
   * Derived, not stored.
   *
   * A revision owns its settings, so there is no second copy that could drift
   * from the prose it was written against — and activating an older revision
   * restores its settings for free rather than needing a matching rollback.
   */
  const settings = activeStory.settings;

  const rationale = useMemo(() => deriveRationale(settings), [settings]);

  /**
   * Append a revision and make it current. Nothing older is discarded.
   *
   * The caller has already decided something changed — it needs that answer
   * anyway to enable its Save button, and computing it twice is how the button
   * and the chat line end up disagreeing.
   */
  const saveRevision = useCallback(
    (text: string, nextSettings: SessionSettings) => {
      const revision = story.versions.length + 1;
      const changed = changedSettings(activeStory.settings, nextSettings);

      setStory((current) => {
        const version: StoryVersion = {
          id: nextVersionId(),
          // Numbering counts revisions made, not list position, so activating an
          // older one does not renumber the rest.
          revision: current.versions.length + 1,
          text,
          variant: activeStory.variant,
          settings: nextSettings,
        };
        return { versions: [...current.versions, version], activeId: version.id };
      });

      say(revisionSummary(revision, text !== activeStory.text, changed));
    },
    [activeStory, say, story.versions.length],
  );

  const activateStoryVersion = useCallback(
    (id: string) => {
      setStory((current) => ({ ...current, activeId: id }));
      const target = story.versions.find((version) => version.id === id);
      // Worth saying out loud: this moves the settings too, which reshapes every
      // scene's frame and what the renderer will run.
      if (target && target.id !== story.activeId) {
        say(
          `Back on revision ${target.revision} — prose and settings both, so the screenplay is showing that cut again.`,
        );
      }
    },
    [say, story],
  );

  /* --------------------------------------------------------------- screenplay */

  const [scenesGenerated, setScenesGenerated] = useState(false);

  const generateScenes = useCallback(() => {
    setScenesGenerated(true);
    say(
      "Scenes are generated. The test screening below has a take per scene — switch between them to compare cuts before the final render.",
    );
  }, [say]);

  const [finalProductionStarted, setFinalProductionStarted] = useState(false);

  const startFinalProduction = useCallback(() => {
    setFinalProductionStarted(true);
    say(
      "Final production is under way. It will appear at the top of this column when it is ready.",
    );
  }, [say]);

  /*
   * `activateSceneVersion` is live. `updateScene`, `duplicateScene`,
   * `deleteScene`, `regenerateOneScene` and `moveScene` are NOT — the scene panel's
   * Edit, Duplicate, Delete and Regenerate controls were removed, and its arrow
   * buttons now step between beats instead of reordering them, so nothing calls
   * any of these.
   *
   * Kept for the same reason as the render engine below: cheap to leave, and the
   * screenplay is still being designed. `regenerateOneScene` in particular carries
   * the "one scene changes, the others are returned by reference" guarantee, which
   * is worth more than the lines it costs. See the README.
   */

  const updateScene = useCallback((id: string, patch: Partial<Scene>) => {
    // An edit is a new version, not an overwrite — that is what makes it
    // reversible from the version list.
    setTracks((current) =>
      current.map((track) =>
        track.id === id ? pushVersion(track, { ...activeScene(track), ...patch }) : track,
      ),
    );
  }, []);

  const duplicateScene = useCallback((id: string) => {
    setTracks((current) => {
      const index = current.findIndex((track) => track.id === id);
      if (index === -1) return current;

      // The copy starts its own history from the version being duplicated.
      const source = activeScene(current[index]);
      const copyId = nextSceneId();
      const copy: SceneTrack = {
        id: copyId,
        beat: source.beat,
        versions: [{ ...source, id: copyId }],
        activeIndex: 0,
        // Same attachments, not the same array — a copy that shared it would
        // delete out of both tracks at once.
        media: [...current[index].media],
      };

      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }, []);

  const deleteScene = useCallback((id: string) => {
    setTracks((current) => current.filter((track) => track.id !== id));
  }, []);

  /**
   * Regenerate exactly one scene.
   *
   * The others are returned by reference, untouched — this is the behaviour the
   * screenplay demo exists to show, so it must be true and not merely look true.
   */
  const regenerateOneScene = useCallback(
    (id: string) => {
      setTracks((current) =>
        current.map((track) =>
          track.id === id
            ? pushVersion(track, regenerateScene(activeScene(track)))
            : track,
        ),
      );
      const beat = tracks.find((track) => track.id === id)?.beat;
      if (beat) say(`New take on the ${beat}. The other scenes are untouched.`);
    },
    [say, tracks],
  );

  const moveScene = useCallback((from: number, to: number) => {
    setTracks((current) => reorder(current, from, to));
  }, []);

  const activateSceneVersion = useCallback((trackId: string, index: number) => {
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, activeIndex: index } : track,
      ),
    );
  }, []);

  /** What every other tab and the renderer read. */
  const scenes = useMemo(() => tracks.map(activeScene), [tracks]);

  /* ------------------------------------------------- scene selection and media */

  const [selectedSceneIds, setSelectedSceneIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const toggleSceneSelected = useCallback((trackId: string) => {
    setSelectedSceneIds((current) => {
      const next = new Set(current);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const setSelectedScenes = useCallback((trackIds: string[]) => {
    setSelectedSceneIds(new Set(trackIds));
  }, []);

  /**
   * Attach another reference still.
   *
   * The index walks the placeholder set by how much is already attached, so a beat
   * with two stills gets a third that is visibly different rather than a repeat of
   * what is already there. Ids make duplicates removable individually anyway, once
   * the set wraps.
   *
   * TODO: takes whatever the Asset Library hands over, once it can hand one over.
   */
  const addSceneMedia = useCallback((trackId: string) => {
    setTracks((current) =>
      current.map((track, index) =>
        track.id === trackId
          ? {
              ...track,
              media: [...track.media, makeSceneMedia(index + track.media.length)],
            }
          : track,
      ),
    );
  }, []);

  const removeSceneMedia = useCallback((trackId: string, mediaId: string) => {
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId
          ? { ...track, media: track.media.filter((item) => item.id !== mediaId) }
          : track,
      ),
    );
  }, []);

  /* ------------------------------------------------------------------ assets */

  /*
   * CURRENTLY UNREACHABLE — the Asset Library's UI was removed to be rebuilt, and it
   * was the only caller of everything in this section.
   *
   * Kept because the shapes are what the real endpoints will return and the
   * behaviours are already specified: `generateAsset` resolves after a delay with one
   * slot rigged to fail the first time, `uploadAsset` takes a real File through an
   * object URL. Rebuilding the UI means calling these, not re-deriving them.
   */

  const generateAsset = useCallback((id: string) => {
    setAssets((current) =>
      current.map((asset) =>
        asset.id === id ? { ...asset, status: "generating", error: undefined } : asset,
      ),
    );

    const delay = 2_000 + Math.random() * 2_000;
    window.setTimeout(() => {
      setAssets((current) =>
        current.map((asset, index) => {
          if (asset.id !== id) return asset;
          // One slot is rigged to fail the first time, so the error state is
          // always reachable in a demo. A retry succeeds.
          const shouldFail = asset.label === "Passer-by" && !asset.error;
          return shouldFail
            ? {
                ...asset,
                status: "failed",
                error: "Generation failed — the model was busy. Try again.",
              }
            : {
                ...asset,
                status: "ready",
                url: placeholderFor(index),
                error: undefined,
              };
        }),
      );
    }, delay);
  }, []);

  const uploadAsset = useCallback((id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setAssets((current) =>
      current.map((asset) =>
        asset.id === id ? { ...asset, status: "ready", url, error: undefined } : asset,
      ),
    );
  }, []);

  const reuseAsset = useCallback((id: string) => {
    setAssets((current) =>
      current.map((asset, index) =>
        asset.id === id
          ? {
              ...asset,
              status: "ready",
              url: placeholderFor(index + 2),
              error: undefined,
            }
          : asset,
      ),
    );
  }, []);

  /* ------------------------------------------------------------------ render */

  /*
   * CURRENTLY UNREACHABLE — nothing calls `startRender`.
   *
   * The Generation tab was removed, and it was the only caller. The engine below
   * is kept deliberately rather than deleted: it is the most intricate logic in
   * the app (a two-at-a-time queue, non-linear progress, a rigged failure and a
   * per-scene retry), it is covered by unit tests over `lib/session/render.ts`,
   * and a video product will need a render surface again. Wiring a new one means
   * calling `startRender` — not rebuilding this.
   *
   * If Generation is genuinely never coming back, delete this section,
   * `lib/session/render.ts`, its tests, and `RenderJob`. See the README.
   */

  // Timers are tracked so a re-render never starts a second set for the same job.
  const timers = useRef<Record<string, number>>({});

  const runScene = useCallback(
    (sceneId: string, index: number, beat: string) => {
      setRenders((current) =>
        current.map((job) =>
          job.sceneId === sceneId
            ? { ...job, status: "rendering", progress: 0, error: undefined }
            : job,
        ),
      );

      const duration = RENDER_MS_MIN + Math.random() * (RENDER_MS_MAX - RENDER_MS_MIN);
      const tick = window.setInterval(() => {
        setRenders((current) =>
          current.map((job) =>
            job.sceneId === sceneId && job.status === "rendering"
              ? { ...job, progress: nextProgress(job.progress) }
              : job,
          ),
        );
      }, 220);
      timers.current[`${sceneId}:tick`] = tick;

      const finish = window.setTimeout(() => {
        window.clearInterval(tick);
        const fails = index === FAILING_SCENE_INDEX;

        setRenders((current) =>
          current.map((job) =>
            job.sceneId === sceneId
              ? fails
                ? { ...job, status: "failed", error: RENDER_ERROR }
                : {
                    ...job,
                    status: "done",
                    progress: 100,
                    thumbnailUrl: placeholderFor(index),
                  }
              : job,
          ),
        );

        // One line per scene landing — not one per progress tick.
        say(
          fails
            ? `The ${beat} failed to render — ${RENDER_ERROR} You can retry just that scene.`
            : `${beat} is done. Moving to the next in the queue.`,
        );
      }, duration);
      timers.current[`${sceneId}:end`] = finish;
    },
    [say],
  );

  /**
   * Scenes already handed to `runScene`.
   *
   * The pump is allowed to run more often than strictly necessary — it fires
   * from an effect that also sees progress ticks — so this makes starting a
   * scene idempotent. Without it, a second pass would start a second timer for
   * the same scene and every status line would be posted twice.
   */
  const started = useRef<Set<string>>(new Set());

  /**
   * Fill any free slots from the queue.
   *
   * Takes the job list as an argument rather than reading it inside a
   * `setRenders` updater: updaters must be pure, and React invokes them twice
   * in development — which is exactly how the duplicate-message bug happened.
   */
  const pump = useCallback(
    (jobs: RenderJob[]) => {
      const active = jobs.filter((job) => job.status === "rendering").length;
      const free = RENDER_CONCURRENCY - active;
      if (free <= 0) return;

      jobs
        .filter((job) => job.status === "queued" && !started.current.has(job.sceneId))
        .slice(0, free)
        .forEach((job) => {
          started.current.add(job.sceneId);
          const index = scenes.findIndex((scene) => scene.id === job.sceneId);
          runScene(job.sceneId, index, scenes[index]?.beat ?? "Scene");
        });
    },
    [runScene, scenes],
  );

  const startRender = useCallback(() => {
    started.current = new Set();
    setRendering(true);
    setRenders(
      scenes.map((scene) => ({ sceneId: scene.id, status: "queued", progress: 0 })),
    );
    say(
      `Rendering ${scenes.length} scenes, ${totalDuration(scenes)}s total, on ${settings.model}. Two at a time.`,
    );
  }, [say, scenes, settings.model]);

  const retryScene = useCallback(
    (sceneId: string) => {
      const beat = scenes.find((scene) => scene.id === sceneId)?.beat ?? "Scene";
      // Stays marked as started, so the pump does not also pick it up.
      started.current.add(sceneId);
      say(`Retrying the ${beat}.`);
      // A retry always succeeds: index -1 never matches FAILING_SCENE_INDEX.
      runScene(sceneId, -1, beat);
    },
    [runScene, say, scenes],
  );

  const active = renders.filter((job) => job.status === "rendering").length;
  const queued = renders.filter((job) => job.status === "queued").length;

  /**
   * Refill the queue as slots free up, and stop when the run is over.
   *
   * Keyed on the active and queued counts specifically: those are the only two
   * numbers that change on a real transition. Keying on "jobs that have left
   * the queue" looks equivalent and is not — it counts rendering and done
   * alike, so it never changes when a scene finishes and the queue stalls with
   * everything after the first two stuck on `queued`.
   *
   * The timeout keeps the state update out of the effect body.
   */
  useEffect(() => {
    if (!rendering) return;
    const timer = window.setTimeout(() => {
      if (queued > 0) pump(renders);
      else if (active === 0) setRendering(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active, queued, rendering, pump, renders]);

  const value = useMemo<SessionValue>(
    () => ({
      prompt,
      settings,
      rationale,
      story,
      activeStory,
      saveRevision,
      activateStoryVersion,
      scenesGenerated,
      generateScenes,
      finalProductionStarted,
      startFinalProduction,
      tracks,
      scenes,
      updateScene,
      duplicateScene,
      deleteScene,
      regenerateOneScene,
      moveScene,
      activateSceneVersion,
      selectedSceneIds,
      toggleSceneSelected,
      setSelectedScenes,
      addSceneMedia,
      removeSceneMedia,
      assets,
      generateAsset,
      uploadAsset,
      reuseAsset,
      renders,
      rendering,
      startRender,
      retryScene,
      messages,
    }),
    [
      prompt,
      settings,
      rationale,
      story,
      activeStory,
      saveRevision,
      activateStoryVersion,
      scenesGenerated,
      generateScenes,
      finalProductionStarted,
      startFinalProduction,
      tracks,
      scenes,
      updateScene,
      duplicateScene,
      deleteScene,
      regenerateOneScene,
      moveScene,
      activateSceneVersion,
      selectedSceneIds,
      toggleSceneSelected,
      setSelectedScenes,
      addSceneMedia,
      removeSceneMedia,
      assets,
      generateAsset,
      uploadAsset,
      reuseAsset,
      renders,
      rendering,
      startRender,
      retryScene,
      messages,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>.");
  return context;
}
