import "server-only";

import type { Project } from "@/types/project";

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

// TODO: remove once the API is wired up.
const MOCK_PROJECTS: Project[] = [
  {
    id: "p_01",
    title: "Neon alley chase",
    createdAt: "2026-08-01T18:20:00.000Z",
    durationSeconds: 10,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_02",
    title: "Espresso pour, macro",
    createdAt: "2026-08-01T09:05:00.000Z",
    durationSeconds: 8,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_03",
    title: "Black sand aerial",
    createdAt: "2026-07-31T16:40:00.000Z",
    durationSeconds: 12,
    aspectRatio: "16:8",
    status: "processing",
  },
  {
    id: "p_04",
    title: "VHS birthday party",
    createdAt: "2026-07-30T11:15:00.000Z",
    durationSeconds: 15,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_05",
    title: "Paper crane flock",
    createdAt: "2026-07-29T14:02:00.000Z",
    durationSeconds: 6,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_06",
    title: "Studio pedestal spin",
    createdAt: "2026-07-28T08:30:00.000Z",
    durationSeconds: 9,
    aspectRatio: "16:8",
    status: "failed",
  },
  {
    id: "p_07",
    title: "Golden hour field",
    createdAt: "2026-07-26T17:55:00.000Z",
    durationSeconds: 11,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_08",
    title: "Rooftop timelapse",
    createdAt: "2026-07-24T21:10:00.000Z",
    durationSeconds: 14,
    aspectRatio: "16:8",
    status: "ready",
  },
  {
    id: "p_09",
    title: "Sneaker drop teaser",
    createdAt: "2026-07-22T13:45:00.000Z",
    durationSeconds: 7,
    aspectRatio: "8:16",
    status: "ready",
  },
  {
    id: "p_10",
    title: "Cliffside drone pull",
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
