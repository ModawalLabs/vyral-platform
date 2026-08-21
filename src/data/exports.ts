import "server-only";

import { EXPORT_STATUSES, type ExportStatus, type VideoExport } from "@/types/export";

/**
 * Export data access.
 *
 * The only file that needs to change when the API lands: keep these signatures and
 * replace the bodies with `fetch`/database calls. Every consumer already awaits them,
 * so no component or page is touched.
 *
 * `server-only` makes that swap safe — importing this from a client component fails
 * the build rather than shipping the mock (or, later, a credential) to the browser.
 */

/*
 * TODO: remove once the API is wired up.
 *
 * Each title describes the artwork it is paired with, not the file it comes from — do
 * not "correct" one against the other. Several of the repo's placeholder filenames are
 * misleading: `neon-alley-chase` is a cyclist in orange dust, `espresso-macro` is two
 * people at a moodboard wall, and `black-sand-aerial` is a burning scarecrow. Titling
 * these from the filenames gave five cards whose names contradicted their own posters.
 */
const MOCK_EXPORTS: VideoExport[] = [
  {
    id: "e_01",
    title: "Dust trail sprint",
    version: 3,
    sceneCount: 5,
    createdAt: "2026-08-18T16:40:00.000Z",
    status: "completed",
    thumbnailUrl: "/assets/projects/neon-alley-chase.webp",
    model: "Veo3",
    aspectRatio: "16:8",
    resolution: "1080p",
  },
  {
    id: "e_02",
    title: "Studio moodboard session",
    version: 2,
    sceneCount: 4,
    createdAt: "2026-08-17T09:12:00.000Z",
    status: "completed",
    thumbnailUrl: "/assets/projects/espresso-macro.webp",
    model: "Kling T2V",
    aspectRatio: "16:8",
    resolution: "1080p",
  },
  {
    id: "e_03",
    title: "Scarecrow burn, dusk",
    version: 1,
    sceneCount: 6,
    createdAt: "2026-08-16T14:05:00.000Z",
    status: "processing",
    thumbnailUrl: "/assets/projects/black-sand-aerial.webp",
    model: "Seedance",
    aspectRatio: "16:8",
    resolution: "720p",
  },
  {
    id: "e_04",
    title: "Showroom reveal",
    version: 5,
    sceneCount: 7,
    createdAt: "2026-08-14T11:30:00.000Z",
    status: "completed",
    thumbnailUrl: "/assets/inspiration/product-launch.webp",
    model: "Hunyuan",
    aspectRatio: "16:8",
    resolution: "1080p",
  },
  {
    id: "e_05",
    title: "Gelato macro, vertical",
    version: 2,
    sceneCount: 3,
    createdAt: "2026-08-12T18:55:00.000Z",
    status: "failed",
    thumbnailUrl: "/assets/inspiration/social-ad.webp",
    model: "Kling",
    aspectRatio: "8:16",
    resolution: "1080p",
  },
];

/**
 * One export by id, or `null` when there is no such thing.
 *
 * `null` rather than throwing, so the page decides what a miss means — here that is
 * `notFound()`, which is a 404 rather than a 500.
 */
export async function getExport(id: string): Promise<VideoExport | null> {
  return MOCK_EXPORTS.find((item) => item.id === id) ?? null;
}

/** Newest first, which is the only order an export list is ever wanted in. */
export async function listExports(): Promise<VideoExport[]> {
  return [...MOCK_EXPORTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * How many exports sit in each status, plus the total.
 *
 * Counted here rather than in the filter component, because the filter is a client
 * component and must not import this module. Every status is present in the result
 * even at zero — a filter whose options appear and disappear as data changes is worse
 * than one showing a zero.
 */
export async function countExportsByStatus(): Promise<
  Record<ExportStatus, number> & { all: number }
> {
  const all = await listExports();
  const counts = Object.fromEntries(
    EXPORT_STATUSES.map((status) => [
      status,
      all.filter((item) => item.status === status).length,
    ]),
  ) as Record<ExportStatus, number>;

  return { ...counts, all: all.length };
}
