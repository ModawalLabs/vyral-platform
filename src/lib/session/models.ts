import type { SessionSettings } from "@/types/session";
import { VERTICAL_PLATFORMS, VERTICAL_RATIO } from "@/types/session";

/**
 * Fake capability profiles, one per model in the composer.
 *
 * Deliberately spread across the trade-offs a director actually weighs —
 * realism, speed, cost, dialogue — so the derived rationale says something
 * different depending on what is picked, rather than reshuffling adjectives.
 */
export type ModelProfile = {
  /** 1–5. */
  realism: number;
  speed: number;
  /** Relative cost per second, in credits. */
  costPerSecond: number;
  dialogue: boolean;
  summary: string;
};

export const MODEL_PROFILES: Record<string, ModelProfile> = {
  Veo3: {
    realism: 5,
    speed: 2,
    costPerSecond: 4,
    dialogue: true,
    summary: "Cinematic realism with synced dialogue.",
  },
  "Kling T2V": {
    realism: 4,
    speed: 3,
    costPerSecond: 3,
    dialogue: false,
    summary: "Strong motion coherence on longer takes.",
  },
  Kling: {
    realism: 3,
    speed: 4,
    costPerSecond: 2,
    dialogue: false,
    summary: "A faster, cheaper pass of the same engine.",
  },
  Seedance: {
    realism: 3,
    speed: 5,
    costPerSecond: 1,
    dialogue: false,
    summary: "Quickest to a draft — good for blocking a cut.",
  },
  "Happy Horse": {
    realism: 2,
    speed: 5,
    costPerSecond: 1,
    dialogue: false,
    summary: "Stylised and playful rather than photoreal.",
  },
  Hunyuan: {
    realism: 4,
    speed: 3,
    costPerSecond: 3,
    dialogue: true,
    summary: "Balanced, with usable lip sync.",
  },
};

export const DEFAULT_PROFILE: ModelProfile = {
  realism: 3,
  speed: 3,
  costPerSecond: 2,
  dialogue: false,
  summary: "General-purpose generation.",
};

export const profileFor = (model: string) => MODEL_PROFILES[model] ?? DEFAULT_PROFILE;

/**
 * Why this model, for these settings.
 *
 * Every line is derived, so changing any setting visibly rewrites the list —
 * which is the point of the card. Pure, so it is cheap to test the wording
 * actually tracks the inputs.
 */
export function deriveRationale(settings: SessionSettings): string[] {
  const profile = profileFor(settings.model);
  const lines = [profile.summary];

  lines.push(
    profile.realism >= 4
      ? "Holds photoreal detail across the whole take."
      : "Trades some realism for turnaround.",
  );

  lines.push(
    profile.speed >= 4
      ? `A ${settings.durationSeconds}s clip lands in about a minute.`
      : `Expect a few minutes for ${settings.durationSeconds}s at this quality.`,
  );

  lines.push(
    `Roughly ${profile.costPerSecond * settings.durationSeconds} credits at ${settings.durationSeconds}s.`,
  );

  lines.push(
    profile.dialogue
      ? "Generates synced dialogue, so the CTA can be spoken."
      : "No dialogue support — plan the CTA as on-screen type.",
  );

  lines.push(
    settings.aspectRatio === VERTICAL_RATIO
      ? `Vertical framing suits ${settings.platform}.`
      : `Landscape framing, cut for ${settings.platform}.`,
  );

  return lines;
}

/**
 * Advice, never a block. A vertical platform with a landscape ratio is a real
 * mismatch, but it is the director's call — the UI says so and moves on.
 */
export function aspectWarning(settings: SessionSettings): string | null {
  const wantsVertical = VERTICAL_PLATFORMS.includes(settings.platform);
  if (!wantsVertical || settings.aspectRatio === VERTICAL_RATIO) return null;

  return `${settings.platform} is a vertical placement. At ${settings.aspectRatio} the frame will be letterboxed or cropped on upload.`;
}
