import type { SessionSettings } from "@/types/session";

/** Display names for the four editable settings, in the order they are shown. */
export const SETTING_LABELS: Record<keyof SessionSettings, string> = {
  model: "Model",
  platform: "Platform",
  aspectRatio: "Aspect ratio",
  durationSeconds: "Duration",
  resolution: "Resolution",
};

const KEYS = Object.keys(SETTING_LABELS) as (keyof SessionSettings)[];

/**
 * Which settings differ, by label.
 *
 * Drives both the Save button's enabled state and the line the director posts,
 * so the two can never disagree about whether anything actually changed.
 */
export function changedSettings(
  before: SessionSettings,
  after: SessionSettings,
): string[] {
  return KEYS.filter((key) => before[key] !== after[key]).map(
    (key) => SETTING_LABELS[key],
  );
}

/**
 * What the director says when a revision lands.
 *
 * Settings changes are called out by name because they have consequences beyond
 * this page — the aspect ratio reshapes every scene's frame and the model
 * decides what the renderer runs.
 */
export function revisionSummary(
  revision: number,
  storyChanged: boolean,
  settingLabels: string[],
): string {
  const parts: string[] = [];
  if (storyChanged) parts.push("the prose");
  if (settingLabels.length > 0) parts.push(settingLabels.join(", ").toLowerCase());

  const what = parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts[0];
  const tail =
    settingLabels.length > 0
      ? " The screenplay and the render queue follow the new settings."
      : " The beats, shot count and target length are unchanged, so the screenplay still lines up.";

  return `Saved as revision ${revision} — you changed ${what}.${tail}`;
}
