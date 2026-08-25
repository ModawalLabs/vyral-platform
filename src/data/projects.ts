import "server-only";

import type { Project, ProjectFolder } from "@/types/project";

/**
 * Project data access.
 *
 * The only file that needs to change when the API lands: keep these signatures
 * and replace the bodies with `fetch`/database calls. Every consumer already
 * awaits them, so no component or page is touched.
 *
 * `server-only` makes that swap safe — importing this from a client component
 * fails the build rather than shipping the mock (or, later, a credential) to
 * the browser.
 */

/*
 * TODO: remove once the API is wired up.
 *
 * The posters are the artwork the repo already ships, dealt round-robin. They are
 * deliberately *not* matched to the titles — the point is to judge the grid with real
 * pictures in it rather than ten identical placeholder tiles, and pairing them up would
 * only make the mock look like data.
 */
const MOCK_PROJECTS: Project[] = [
  {
    id: "p_01",
    title: "Neon alley chase",
    prompt:
      "A lone rider on a dirt bike tearing down a desert track at golden hour, low chase camera close to the ground, thick orange dust behind the rear wheel.",
    model: "Veo3",
    resolution: "1080p",
    thumbnailUrl: "/assets/projects/neon-alley-chase.webp",
    createdAt: "2026-08-01T18:20:00.000Z",
    durationSeconds: 10,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_02",
    title: "Espresso pour, macro",
    prompt:
      "Two designers pinning reference prints to a cork moodboard wall in a bright studio, warm window light from the left, handheld and unhurried.",
    model: "Kling T2V",
    resolution: "1080p",
    thumbnailUrl: "/assets/projects/espresso-macro.webp",
    createdAt: "2026-08-01T09:05:00.000Z",
    durationSeconds: 8,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_03",
    title: "Black sand aerial",
    prompt:
      "A wicker scarecrow burning against a dusk field, sparks lifting into a deep blue sky, slow orbit with the flame as the only light source.",
    model: "Seedance",
    resolution: "720p",
    createdAt: "2026-07-31T16:40:00.000Z",
    durationSeconds: 12,
    aspectRatio: "16:8",
    status: "processing",
  },
  {
    id: "p_04",
    title: "VHS birthday party",
    prompt:
      "A living room birthday party shot on a camcorder, tape grain and date stamp, blown-out highlights from a single overhead bulb.",
    model: "Happy Horse",
    resolution: "720p",
    thumbnailUrl: "/assets/inspiration/product-launch.webp",
    createdAt: "2026-07-30T11:15:00.000Z",
    durationSeconds: 15,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_05",
    title: "Paper crane flock",
    prompt:
      "A flock of folded paper cranes lifting off a table in sequence, macro to wide, soft north light and a plain backdrop.",
    model: "Seedance",
    resolution: "1080p",
    thumbnailUrl: "/assets/inspiration/social-ad.webp",
    createdAt: "2026-07-29T14:02:00.000Z",
    durationSeconds: 6,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_06",
    title: "Studio pedestal spin",
    prompt:
      "A hero product turning on a matte pedestal against a seamless backdrop, crisp rim lighting, one continuous rotation with no cuts.",
    model: "Hunyuan",
    resolution: "1080p",
    createdAt: "2026-07-28T08:30:00.000Z",
    durationSeconds: 9,
    aspectRatio: "16:8",
    status: "failed",
  },
  {
    id: "p_07",
    title: "Golden hour field",
    prompt:
      "A couple walking through an open field at golden hour, drifting slider move, warm halation and long grass in the foreground.",
    model: "Veo3",
    resolution: "1080p",
    thumbnailUrl: "/assets/inspiration/music-video.webp",
    createdAt: "2026-07-26T17:55:00.000Z",
    durationSeconds: 11,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_08",
    title: "Rooftop timelapse",
    prompt:
      "A city rooftop from dusk into night, clouds racing over the skyline, lights coming on across the buildings below.",
    model: "Kling",
    resolution: "1080p",
    thumbnailUrl: "/assets/inspiration/wedding-film.webp",
    createdAt: "2026-07-24T21:10:00.000Z",
    durationSeconds: 14,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_09",
    title: "Sneaker drop teaser",
    prompt:
      "A sneaker rotating in mid-air against a hard colour backdrop, strobe-lit, dust and confetti frozen around it.",
    model: "Kling T2V",
    resolution: "1080p",
    thumbnailUrl: "/assets/projects/neon-alley-chase.webp",
    createdAt: "2026-07-22T13:45:00.000Z",
    durationSeconds: 7,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_10",
    title: "Cliffside drone pull",
    prompt:
      "A drone pulling back from a cliff edge to reveal the coastline, morning haze, the horizon holding level throughout.",
    model: "Veo3",
    resolution: "1080p",
    thumbnailUrl: "/assets/projects/espresso-macro.webp",
    createdAt: "2026-07-19T10:25:00.000Z",
    durationSeconds: 13,
    aspectRatio: "16:8",
    status: "ready",
  },
];

const byNewestFirst = (a: Project, b: Project) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

export async function listProjects(): Promise<Project[]> {
  return [...MOCK_PROJECTS].sort(byNewestFirst);
}

export async function listRecentProjects(limit = 3): Promise<Project[]> {
  const projects = await listProjects();
  return projects.slice(0, limit);
}

// TODO: remove once the API is wired up. Ids point into `MOCK_PROJECTS` above —
// a folder holding an id that no longer resolves simply shows a smaller count,
// which is the behaviour a real join would give after a project is deleted.
const MOCK_FOLDERS: ProjectFolder[] = [
  {
    id: "f_01",
    name: "Client work",
    projectIds: ["p_02", "p_06", "p_08"],
    createdAt: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "f_02",
    name: "Vertical cuts",
    projectIds: ["p_04", "p_07", "p_09"],
    createdAt: "2026-07-25T12:30:00.000Z",
  },
  {
    id: "f_03",
    name: "Pitch reel",
    projectIds: ["p_01"],
    createdAt: "2026-08-02T08:10:00.000Z",
  },
];

export async function listFolders(): Promise<ProjectFolder[]> {
  // Newest first, matching the grid's default order so the two blocks on the
  // page never disagree about what "recent" means.
  return [...MOCK_FOLDERS].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
