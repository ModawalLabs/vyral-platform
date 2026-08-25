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
    prompt:
      "A lone rider on a dirt bike tearing down a desert track at golden hour, thick orange dust kicking up behind the rear wheel. Low chase camera, close to the ground, matching speed. Hard afternoon sun, long shadows, heat shimmer on the horizon. Five beats: the start line, the first corner, a low tracking shot through the dust, a slow-motion rear wheel spray, then the rider disappearing into the haze.",
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
    prompt:
      "Two designers standing at a cork moodboard wall in a bright studio, pinning up reference prints and stepping back to talk. Warm window light from the left, plants and coffee cups on the desk behind them. Handheld, unhurried, documentary feel. Four beats: the wall filling up, a close pass over the pinned prints, the pair in discussion, and a wide of the finished board.",
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
    prompt:
      "A wicker scarecrow burning against a dusk field, sparks lifting into a deep blue sky. Slow orbit, the flame the only light source, silhouetted stubble in the foreground. Six beats building from the first catch to the collapse.",
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
    prompt:
      "A single presenter on a dark stage revealing a concept car under a hard rim light, audience in silhouette. Slow crane down and around the front wing as the reveal lands. Deep blacks, cyan practicals, no music cue in the last beat — leave it silent. Seven beats.",
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
    prompt:
      "Vertical macro on a scoop of strawberry gelato as syrup pours over it, backlit so the surface reads translucent. Extremely shallow depth of field, tiny ice crystals catching the light. Three beats: the pour beginning, the crown of syrup at its widest, and the first drip down the side.",
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
