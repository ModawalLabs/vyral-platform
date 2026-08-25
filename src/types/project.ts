import type { Resolution, SessionSettings } from "@/types/session";

/**
 * A generated video in the user's library.
 *
 * This is the contract the Projects UI renders against — shape the API
 * response to match (or map to it in `src/data/projects.ts`) and every card
 * populates without touching a component.
 */
export type Project = {
  id: string;
  title: string;
  /** Poster frame. Absent while a render is still processing or has failed. */
  thumbnailUrl?: string;
  /** ISO 8601. Drives the relative timestamp under each card. */
  createdAt: string;
  durationSeconds?: number;
  aspectRatio?: "16:8" | "8:16";
  status: ProjectStatus;

  /**
   * The brief it was generated from, and what generated it.
   *
   * Typed off `SessionSettings` rather than restated, so a project and the workspace can
   * only ever offer the same vocabulary — the same reasoning as `VideoExport`. Unlike an
   * export these are the *current* settings, since a project is still being edited.
   */
  prompt: string;
  model: SessionSettings["model"];
  resolution: Resolution;
};

export type ProjectStatus = "ready" | "processing" | "failed";

/**
 * A user-made grouping of projects.
 *
 * Membership is a list of ids rather than a `folderId` on `Project`, for two
 * reasons: a project can sit in more than one folder without duplicating it,
 * and the order a folder was filled in is worth keeping — `projectIds` is
 * oldest-added first, so a folder can show what went in last.
 *
 * Folders are a view over the library, never a container that owns anything.
 * Deleting one must not delete a project, which is why nothing here is a
 * `Project`.
 */
export type ProjectFolder = {
  id: string;
  name: string;
  /** Ids into the project library. Oldest addition first. */
  projectIds: string[];
  /** ISO 8601. */
  createdAt: string;
};
