import type { ComposerSettings } from "@/components/home/composer-settings";

/** Where the finished video is going. Drives the aspect-ratio advice. */
export const PLATFORMS = ["Instagram Reel", "TikTok", "YouTube", "Website hero"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** Platforms that expect a vertical frame. */
export const VERTICAL_PLATFORMS: readonly Platform[] = ["Instagram Reel", "TikTok"];

/** The app's vertical option. See the README on why it is 8:16 and not 9:16. */
export const VERTICAL_RATIO = "8:16";

/**
 * Output resolutions. Session-only — the home composer does not offer it, so a
 * handed-over session picks up `DEFAULT_RESOLUTION` rather than carrying one.
 */
export const RESOLUTIONS = ["720p", "1080p"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];
export const DEFAULT_RESOLUTION: Resolution = "1080p";

export type SessionSettings = ComposerSettings & {
  platform: Platform;
  resolution: Resolution;
};

export type ChatMessage = {
  id: string;
  from: "user" | "director";
  text: string;
};

/**
 * One revision of the brief.
 *
 * A revision snapshots the prose **and** the settings it was written under,
 * because the two are one decision: a 30-second landscape YouTube cut and a
 * 10-second vertical Reel are not the same film with different knobs. Activating
 * an older revision therefore restores both.
 */
export type StoryVersion = {
  id: string;
  /** 1-based, and stable — it does not renumber when another version is made active. */
  revision: number;
  text: string;
  /** Which canned variant it came from. See `nextStoryVariant`. */
  variant: number;
  settings: SessionSettings;
};

/**
 * Every revision ever made, plus a marker for the current one.
 *
 * Activating an older revision moves the marker; it never discards the newer
 * ones, so the move is reversible. `versions[activeId].settings` is the session's
 * live settings — there is no separate copy to fall out of step with.
 */
export type Story = {
  versions: StoryVersion[];
  activeId: string;
};

export const BEATS = ["Hook", "Problem", "Solution", "Lifestyle", "CTA"] as const;
export type Beat = (typeof BEATS)[number];

/**
 * One shot. `beat` is its identity; the other eight fields are what the
 * expanded card edits.
 */
export type Scene = {
  id: string;
  beat: Beat;
  durationSeconds: number;
  visual: string;
  camera: string;
  lighting: string;
  action: string;
  dialogue: string;
  sound: string;
  transition: string;
};

/**
 * A scene and its history.
 *
 * Editing or regenerating appends a version rather than overwriting, so a take
 * can always be compared with the one before it. `versions[activeIndex]` is
 * what renders, what counts toward the duration total, and what gets rendered.
 */
export type SceneTrack = {
  id: string;
  beat: Beat;
  versions: Scene[];
  activeIndex: number;
};

export const ASSET_KINDS = [
  { key: "characters", label: "Characters" },
  { key: "environments", label: "Environments" },
  { key: "products", label: "Product images" },
  { key: "brand", label: "Brand kit" },
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number]["key"];

export type AssetStatus = "empty" | "generating" | "ready" | "failed";

export type Asset = {
  id: string;
  kind: AssetKind;
  label: string;
  status: AssetStatus;
  /** Object URL for an upload, or a placeholder path for a generation. */
  url?: string;
  error?: string;
  /** Scenes that need this asset, for the coverage checklist. */
  sceneBeats: Beat[];
};

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

export type RenderJob = {
  sceneId: string;
  status: RenderStatus;
  /** 0–100. Non-linear by design; see `nextProgress`. */
  progress: number;
  thumbnailUrl?: string;
  error?: string;
};
