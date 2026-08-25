import { describe, expect, it } from "vitest";

import {
  activeChips,
  applyFilters,
  clearChip,
  clearFilters,
  countByStatus,
  DEFAULT_FILTERS,
  matchesQuery,
  type ProjectFilters,
} from "@/components/projects/project-filters";
import type { Project } from "@/types/project";

// Only the fields these tests filter on are interesting; the rest are filled with
// anything valid so the fixture stays a `Project` as the type grows.
const project = (overrides: Partial<Project> & Pick<Project, "id">): Project => ({
  title: "Untitled",
  createdAt: "2026-08-01T00:00:00.000Z",
  status: "ready",
  prompt: "A short cut.",
  model: "Veo3",
  resolution: "1080p",
  ...overrides,
});

const LIBRARY: Project[] = [
  project({
    id: "a",
    title: "Neon alley chase",
    createdAt: "2026-08-03T00:00:00.000Z",
    aspectRatio: "16:8",
  }),
  project({
    id: "b",
    title: "Café pour, macro",
    createdAt: "2026-08-02T00:00:00.000Z",
    aspectRatio: "16:8",
    status: "processing",
  }),
  project({
    id: "c",
    title: "Sneaker drop teaser",
    createdAt: "2026-08-01T00:00:00.000Z",
    aspectRatio: "8:16",
  }),
  // No aspect ratio at all — the case a format filter has to make a decision about.
  project({ id: "d", title: "Zebra crossing", createdAt: "2026-07-30T00:00:00.000Z" }),
];

const withFilters = (overrides: Partial<ProjectFilters>): ProjectFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});

describe("matchesQuery", () => {
  it("matches on a substring, not just a prefix", () => {
    expect(matchesQuery(LIBRARY[0], "alley")).toBe(true);
  });

  it("ignores case and diacritics in both directions", () => {
    expect(matchesQuery(LIBRARY[1], "cafe")).toBe(true);
    expect(matchesQuery(LIBRARY[1], "CAFÉ")).toBe(true);
  });

  it("treats whitespace-only as no query", () => {
    expect(matchesQuery(LIBRARY[0], "   ")).toBe(true);
  });
});

describe("applyFilters", () => {
  it("defaults to newest first", () => {
    expect(applyFilters(LIBRARY, DEFAULT_FILTERS).map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("sorts oldest first and by title without touching the filters", () => {
    expect(
      applyFilters(LIBRARY, withFilters({ sort: "oldest" })).map((p) => p.id),
    ).toEqual(["d", "c", "b", "a"]);
    expect(
      applyFilters(LIBRARY, withFilters({ sort: "title" })).map((p) => p.id),
    ).toEqual(["b", "a", "c", "d"]);
  });

  it("never reorders the array it was given", () => {
    const input = [...LIBRARY];
    applyFilters(input, withFilters({ sort: "title" }));
    expect(input.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("excludes a project with no aspect ratio from every format filter", () => {
    // The interesting half: "d" is in neither, rather than in both.
    expect(
      applyFilters(LIBRARY, withFilters({ format: "landscape" })).map((p) => p.id),
    ).toEqual(["a", "b"]);
    expect(
      applyFilters(LIBRARY, withFilters({ format: "portrait" })).map((p) => p.id),
    ).toEqual(["c"]);
  });

  it("composes status, format and query", () => {
    expect(
      applyFilters(
        LIBRARY,
        withFilters({ status: "ready", format: "landscape", query: "neon" }),
      ).map((p) => p.id),
    ).toEqual(["a"]);
  });
});

describe("countByStatus", () => {
  it("counts against the other active filters, not the whole library", () => {
    // "b" is the only processing project, and it is landscape — so under a portrait
    // filter, offering "Processing" has to read 0.
    const filters = withFilters({ format: "portrait" });
    expect(countByStatus(LIBRARY, filters, "processing")).toBe(0);
    expect(countByStatus(LIBRARY, filters, "ready")).toBe(1);
  });

  it("ignores whatever status is currently set", () => {
    const filters = withFilters({ status: "failed" });
    expect(countByStatus(LIBRARY, filters, "ready")).toBe(3);
  });
});

describe("chips", () => {
  it("reports only the controls that are narrowing, never sort", () => {
    expect(activeChips(withFilters({ sort: "title" }))).toEqual([]);
    expect(
      activeChips(withFilters({ query: " neon ", status: "failed", format: "portrait" })),
    ).toEqual([
      { key: "query", label: "“neon”" },
      { key: "status", label: "Failed" },
      { key: "format", label: "Portrait" },
    ]);
  });

  it("clears one control and leaves the rest", () => {
    const filters = withFilters({ query: "neon", status: "failed", sort: "title" });
    expect(clearChip(filters, "status")).toEqual(
      withFilters({ query: "neon", status: "all", sort: "title" }),
    );
    expect(clearChip(filters, "query")).toEqual(
      withFilters({ query: "", status: "failed", sort: "title" }),
    );
  });

  it("keeps the chosen order when clearing everything", () => {
    const cleared = clearFilters(
      withFilters({
        query: "neon",
        status: "failed",
        format: "portrait",
        sort: "oldest",
      }),
    );
    expect(cleared).toEqual(withFilters({ sort: "oldest" }));
    expect(activeChips(cleared)).toEqual([]);
  });
});
