import type { LucideIcon } from "lucide-react";
import {
  ArrowDownAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  CheckCircle2,
  LoaderCircle,
  CircleDashed,
  Monitor,
  Proportions,
  Smartphone,
  TriangleAlert,
} from "lucide-react";

import type { Project, ProjectStatus } from "@/types/project";

/**
 * Filtering and sorting for the project library.
 *
 * Deliberately a plain module with no React in it. The library page is a client
 * component holding a good deal of state, and none of *this* needs to be — keeping
 * the predicates pure means they can be tested directly, and means the same
 * functions serve both the whole library and a single folder's contents without a
 * second implementation drifting away from the first.
 *
 * Every control here maps onto a field `Project` actually carries. That is a
 * constraint worth stating: a filter that cannot narrow anything is worse than no
 * filter, because it reads as broken rather than as absent.
 */

export type StatusFilter = ProjectStatus | "all";
export type FormatFilter = "all" | "landscape" | "portrait";
export type SortOrder = "newest" | "oldest" | "title";

export type ProjectFilters = {
  query: string;
  status: StatusFilter;
  format: FormatFilter;
  sort: SortOrder;
};

export const DEFAULT_FILTERS: ProjectFilters = {
  query: "",
  status: "all",
  format: "all",
  sort: "newest",
};

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  Icon: LucideIcon;
};

export const STATUS_OPTIONS: readonly FilterOption<StatusFilter>[] = [
  { value: "all", label: "Any status", Icon: CircleDashed },
  { value: "ready", label: "Ready", Icon: CheckCircle2 },
  { value: "processing", label: "Processing", Icon: LoaderCircle },
  { value: "failed", label: "Failed", Icon: TriangleAlert },
];

/**
 * `Project.aspectRatio` is the wire format; landscape and portrait are what a person
 * looking for a Reel actually has in mind. The translation lives here so no component
 * has to know that "8:16" means vertical.
 */
const ASPECT_FOR: Record<
  Exclude<FormatFilter, "all">,
  NonNullable<Project["aspectRatio"]>
> = {
  landscape: "16:8",
  portrait: "8:16",
};

export const FORMAT_OPTIONS: readonly FilterOption<FormatFilter>[] = [
  { value: "all", label: "Any format", Icon: Proportions },
  { value: "landscape", label: "Landscape", Icon: Monitor },
  { value: "portrait", label: "Portrait", Icon: Smartphone },
];

export const SORT_OPTIONS: readonly FilterOption<SortOrder>[] = [
  { value: "newest", label: "Newest first", Icon: CalendarArrowDown },
  { value: "oldest", label: "Oldest first", Icon: CalendarArrowUp },
  { value: "title", label: "Title A–Z", Icon: ArrowDownAZ },
];

/**
 * Case- and accent-insensitive, so "cafe" finds "Café pour".
 *
 * `Intl.Collator` would be the principled tool but it only compares whole strings,
 * and this needs a *substring* test. Decomposing and dropping the combining marks
 * gets the same insensitivity on a needle that can sit anywhere in the title.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

export function matchesQuery(project: Project, query: string): boolean {
  const needle = query.trim();
  if (needle === "") return true;
  return fold(project.title).includes(fold(needle));
}

function matchesFormat(project: Project, format: FormatFilter): boolean {
  if (format === "all") return true;
  // A project with no aspect ratio yet is genuinely unknown, not "either" — so a
  // format filter excludes it rather than guessing.
  return project.aspectRatio === ASPECT_FOR[format];
}

const COMPARE: Record<SortOrder, (a: Project, b: Project) => number> = {
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  oldest: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
};

/**
 * Narrow, then order. Never mutates the input — the caller's array is the library
 * itself and re-sorting it in place would quietly reorder every other view of it.
 */
export function applyFilters(
  projects: readonly Project[],
  filters: ProjectFilters,
): Project[] {
  return projects
    .filter(
      (project) =>
        matchesQuery(project, filters.query) &&
        (filters.status === "all" || project.status === filters.status) &&
        matchesFormat(project, filters.format),
    )
    .sort(COMPARE[filters.sort]);
}

/**
 * How many projects a given status would leave, ignoring the status filter itself.
 *
 * Counted against the *other* active filters rather than the whole library, so the
 * number beside "Failed" is what you will actually get if you pick it. A count that
 * promised three and delivered none would be worse than no count.
 */
export function countByStatus(
  projects: readonly Project[],
  filters: ProjectFilters,
  status: StatusFilter,
): number {
  return applyFilters(projects, { ...filters, status }).length;
}

export function countByFormat(
  projects: readonly Project[],
  filters: ProjectFilters,
  format: FormatFilter,
): number {
  return applyFilters(projects, { ...filters, format }).length;
}

export type ActiveFilterChip = {
  /** Which control to reset when the chip's × is pressed. */
  key: "query" | "status" | "format";
  label: string;
};

/**
 * The narrowing currently in force, as removable chips.
 *
 * Sort is excluded on purpose: ordering is always in force, so a chip for it would
 * never be dismissible and would sit there permanently next to ones that are.
 */
export function activeChips(filters: ProjectFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  const query = filters.query.trim();
  if (query !== "") chips.push({ key: "query", label: `“${query}”` });

  if (filters.status !== "all") {
    const option = STATUS_OPTIONS.find((o) => o.value === filters.status);
    if (option) chips.push({ key: "status", label: option.label });
  }

  if (filters.format !== "all") {
    const option = FORMAT_OPTIONS.find((o) => o.value === filters.format);
    if (option) chips.push({ key: "format", label: option.label });
  }

  return chips;
}

/** Reset one chip without disturbing the rest. Sort is never cleared. */
export function clearChip(
  filters: ProjectFilters,
  key: ActiveFilterChip["key"],
): ProjectFilters {
  return { ...filters, [key]: key === "query" ? "" : "all" };
}

/** Clear every narrowing control, keeping the chosen order. */
export function clearFilters(filters: ProjectFilters): ProjectFilters {
  return { ...DEFAULT_FILTERS, sort: filters.sort };
}
