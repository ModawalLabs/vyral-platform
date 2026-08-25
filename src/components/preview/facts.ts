import { ASPECT_RATIOS } from "@/components/home/composer-settings";
import type { SessionSettings } from "@/types/session";
import type { PreviewFact } from "@/types/preview";

type AppAspect = SessionSettings["aspectRatio"];

/**
 * The app's aspect options as a number, for laying a frame out.
 *
 * These are the app's own labels, which are deliberately `16:8` and `8:16` rather than
 * the true 16:9 and 9:16 — see the README. So the frame really is drawn at 2:1, and a
 * 16:9 placeholder still loses a little top and bottom to `object-cover`. That is the
 * same trade the export detail page makes, and the alternative is a frame whose shape
 * disagrees with the ratio printed beside it.
 */
export const RATIO_NUMBER: Record<AppAspect, number> = {
  "16:8": 2,
  "8:16": 0.5,
};

/**
 * "16:8 · Landscape".
 *
 * Spelled the same way the workspace's aspect pill spells it — the bare ratio is the
 * app's internal vocabulary and means little on its own.
 */
export function aspectFact(value: AppAspect): PreviewFact {
  const option = ASPECT_RATIOS.find((entry) => entry.value === value) ?? ASPECT_RATIOS[0];
  return { label: "Aspect ratio", value: `${option.value} · ${option.label}` };
}

export function durationFact(seconds: number): PreviewFact {
  return { label: "Duration", value: `${seconds}s` };
}
