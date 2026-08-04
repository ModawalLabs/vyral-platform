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
};

export type ProjectStatus = "ready" | "processing" | "failed";
