import type { Resolution, SessionSettings } from "@/types/session";

/**
 * The statuses an export can be in, in the order the filter shows them.
 *
 * Declared as a list rather than a bare union so the filter can iterate it — a
 * hand-written array beside the type is how a fourth status ends up in one and not
 * the other.
 */
export const EXPORT_STATUSES = ["completed", "processing", "failed"] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

/**
 * One rendered cut, delivered.
 *
 * Distinct from `Project`: a project is the thing you keep editing, an export is a
 * specific version of it that was rendered out and can be downloaded. One project
 * produces many exports, which is why `version` lives here and not there.
 */
export type VideoExport = {
  id: string;
  /** The video's name, as the project was titled when this was rendered. */
  title: string;
  /** Which render of that project this is. Displayed as `v3`. */
  version: number;
  sceneCount: number;
  createdAt: string;
  status: ExportStatus;
  /**
   * The brief this cut was generated from.
   *
   * Kept on the export rather than only on the project, because a project’s prompt
   * keeps being rewritten while an export is a record of one render — pointing this at
   * the live project would make an old export claim it was made from a brief that did
   * not exist yet.
   *
   * Required: nothing here was generated without one.
   */
  prompt: string;

  /**
   * Poster frame.
   *
   * Present even on a failed or in-flight export, unlike `Project.thumbnailUrl`: an
   * export is a re-render of something that already has a poster, so there is art to
   * show while the new cut is still encoding.
   */
  thumbnailUrl?: string;

  /*
   * What this render was produced with.
   *
   * Typed off `SessionSettings` rather than restated, so the export detail page and
   * the Production Workspace can only ever offer the same vocabulary. These are a
   * record of what *was* used, so they are fixed once the render happens — unlike the
   * session's own settings, which are still being edited.
   */
  model: SessionSettings["model"];
  aspectRatio: SessionSettings["aspectRatio"];
  resolution: Resolution;
};
