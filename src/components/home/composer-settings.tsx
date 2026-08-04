import { RectangleHorizontal, RectangleVertical } from "lucide-react";

/**
 * The settings a prompt is submitted with, and the vocabulary behind them.
 *
 * Data and helpers only — no components. The composer used to render a bar of pills
 * from this file; that moved to the Production Workspace, which is now the one place
 * these are chosen. The icons stay because `ASPECT_RATIOS` carries them.
 */

export const MODELS = [
  "Kling T2V",
  "Seedance",
  "Kling",
  "Happy Horse",
  "Hunyuan",
  "Veo3",
] as const;

export const ASPECT_RATIOS = [
  { value: "16:8", label: "Landscape", Icon: RectangleHorizontal },
  { value: "8:16", label: "Portrait", Icon: RectangleVertical },
] as const;

export const MIN_DURATION = 5;
export const MAX_DURATION = 15;

export type ComposerSettings = {
  model: (typeof MODELS)[number];
  durationSeconds: number;
  aspectRatio: (typeof ASPECT_RATIOS)[number]["value"];
};

export const DEFAULT_SETTINGS: ComposerSettings = {
  model: "Veo3",
  durationSeconds: 10,
  aspectRatio: "16:8",
};

/**
 * Rebuild settings from URL values, which are untrusted — anything unrecognised
 * falls back to the default rather than propagating into a generation request.
 * A hand-edited `?duration=999` clamps instead of being honoured or throwing.
 */
export function parseSettings(raw: {
  model?: string;
  duration?: string;
  aspect?: string;
}): ComposerSettings {
  const duration = Number.parseInt(raw.duration ?? "", 10);

  return {
    model: MODELS.find((model) => model === raw.model) ?? DEFAULT_SETTINGS.model,
    durationSeconds: Number.isFinite(duration)
      ? Math.min(Math.max(duration, MIN_DURATION), MAX_DURATION)
      : DEFAULT_SETTINGS.durationSeconds,
    aspectRatio:
      ASPECT_RATIOS.find((option) => option.value === raw.aspect)?.value ??
      DEFAULT_SETTINGS.aspectRatio,
  };
}

/** The inverse: settings as query params, for handing a session to `/new`. */
export function settingsToParams(settings: ComposerSettings) {
  return {
    model: settings.model,
    duration: String(settings.durationSeconds),
    aspect: settings.aspectRatio,
  };
}
