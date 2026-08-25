import type { SpendCycle, SpendEntry } from "@/types/spending";

/**
 * Everything the spending panel needs to know, as pure functions.
 *
 * No React here on purpose. The panel is a client component holding a drill-down and a
 * group-by, and none of the arithmetic underneath it needs to be — which means all of
 * it can be tested directly, and the same folds serve the whole cycle and one drilled
 * project without a second implementation to keep in step.
 *
 * Everything is a fold over the ledger. No total on this page is stored anywhere; if a
 * figure is wrong, exactly one function is wrong.
 */

export type Dimension = "project" | "model";

/** One row of a breakdown. */
export type SpendGroup = {
  /** Stable id for the drill-down — a project id, or the model's own name. */
  key: string;
  label: string;
  credits: number;
  /** 0–1 of the total the group was measured against. */
  share: number;
  /** How many renders it took. Distinguishes "expensive" from "done a lot". */
  renders: number;
  seconds: number;
};

const MS_PER_DAY = 86_400_000;

/** Whole days from the cycle's start. Day 0 is the first day of the cycle. */
export function dayIndex(iso: string, cycle: SpendCycle): number {
  return Math.floor((Date.parse(iso) - Date.parse(cycle.startsAt)) / MS_PER_DAY);
}

export function totalCredits(entries: readonly SpendEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.credits, 0);
}

const keyOf = (entry: SpendEntry, dimension: Dimension) =>
  dimension === "project" ? entry.projectId : entry.model;

const labelOf = (entry: SpendEntry, dimension: Dimension) =>
  dimension === "project" ? entry.projectTitle : entry.model;

/**
 * Rank a set of entries by one dimension.
 *
 * `share` is measured against the entries actually passed in, not against the whole
 * cycle. That is what makes the drill-down honest: inside one project, "Veo3 is 70%"
 * means 70% *of that project*, which is the question you asked by drilling.
 *
 * Sorted by credits, then by label, so two groups that cost the same do not swap places
 * between renders.
 */
export function groupSpend(
  entries: readonly SpendEntry[],
  dimension: Dimension,
): SpendGroup[] {
  const total = totalCredits(entries);
  const groups = new Map<string, SpendGroup>();

  for (const entry of entries) {
    const key = keyOf(entry, dimension);
    const existing = groups.get(key);

    if (existing) {
      existing.credits += entry.credits;
      existing.renders += 1;
      existing.seconds += entry.seconds;
    } else {
      groups.set(key, {
        key,
        label: labelOf(entry, dimension),
        credits: entry.credits,
        share: 0,
        renders: 1,
        seconds: entry.seconds,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      // Guard the empty case rather than letting it produce NaN and paint a bar of
      // width "NaN%", which browsers silently drop.
      share: total === 0 ? 0 : group.credits / total,
    }))
    .sort((a, b) => b.credits - a.credits || a.label.localeCompare(b.label));
}

export function entriesFor(
  entries: readonly SpendEntry[],
  dimension: Dimension,
  key: string,
): SpendEntry[] {
  return entries.filter((entry) => keyOf(entry, dimension) === key);
}

/** The other one. A two-dimension drill always cuts by the axis you did not pick. */
export const otherDimension = (dimension: Dimension): Dimension =>
  dimension === "project" ? "model" : "project";

export type BurnPoint = {
  /** Days since the cycle started. */
  day: number;
  /** Credits left at the end of that day. */
  remaining: number;
};

/**
 * Credits remaining, one point per day from the start of the cycle to `asOf`.
 *
 * A point on every day rather than only on days with a render, so the line's slope is
 * literally the burn rate — flat where nothing was generated, steep where a lot was.
 * Skipping the quiet days would draw a straight line between two spikes and hide
 * exactly the pauses that make the shape readable.
 */
export function burnDown(entries: readonly SpendEntry[], cycle: SpendCycle): BurnPoint[] {
  const asOfDay = dayIndex(cycle.asOf, cycle);
  const spentOn = new Array<number>(asOfDay + 1).fill(0);

  for (const entry of entries) {
    const day = dayIndex(entry.at, cycle);
    if (day >= 0 && day <= asOfDay) spentOn[day] += entry.credits;
  }

  let remaining = cycle.allowance;
  return spentOn.map((spent, day) => {
    remaining -= spent;
    return { day, remaining };
  });
}

export type SpendForecast = {
  /** Mean credits per day over the trailing window. */
  perDay: number;
  /** Days of the cycle still to come. */
  daysLeft: number;
  /** Credits left today. */
  remaining: number;
  /** What is projected to be left when the allowance renews. Never negative. */
  remainingAtRenewal: number;
  /**
   * Fractional day index the balance is projected to hit zero, or `null` if the
   * current pace does not exhaust it before renewal.
   */
  runsOutOnDay: number | null;
  /** Total days in the cycle. */
  cycleDays: number;
};

/** How many trailing days the rate is measured over. */
export const RATE_WINDOW_DAYS = 7;

/**
 * Where the balance is heading.
 *
 * The rate comes from the trailing week, not the cycle average. Someone who barely
 * generated for a fortnight and then started a big cut every day is about to run out,
 * and an average over the whole cycle would reassure them right up until they did. The
 * window shortens rather than reaching back before the cycle started, so the first days
 * of a cycle forecast from what actually exists.
 */
export function forecast(
  entries: readonly SpendEntry[],
  cycle: SpendCycle,
): SpendForecast {
  const asOfDay = dayIndex(cycle.asOf, cycle);
  const cycleDays = dayIndex(cycle.renewsAt, cycle);
  const daysLeft = Math.max(0, cycleDays - asOfDay);

  const windowDays = Math.min(RATE_WINDOW_DAYS, asOfDay + 1);
  const firstDay = asOfDay - windowDays + 1;
  const windowSpend = entries
    .filter((entry) => {
      const day = dayIndex(entry.at, cycle);
      return day >= firstDay && day <= asOfDay;
    })
    .reduce((sum, entry) => sum + entry.credits, 0);

  const perDay = windowDays === 0 ? 0 : windowSpend / windowDays;
  const remaining = cycle.allowance - totalCredits(entries);
  const projected = perDay * daysLeft;

  const runsOutOnDay =
    perDay > 0 && projected > remaining ? asOfDay + remaining / perDay : null;

  return {
    perDay,
    daysLeft,
    remaining,
    remainingAtRenewal: Math.max(0, remaining - projected),
    runsOutOnDay,
    cycleDays,
  };
}

/**
 * The cycle's headline figures.
 *
 * Grouped into one function so the strip above the chart and the chart itself cannot
 * end up computing "busiest model" two slightly different ways.
 */
export function cycleSummary(entries: readonly SpendEntry[], cycle: SpendCycle) {
  const asOfDay = dayIndex(cycle.asOf, cycle);
  const total = totalCredits(entries);
  const [topProject] = groupSpend(entries, "project");
  const [topModel] = groupSpend(entries, "model");

  return {
    total,
    renders: entries.length,
    // Days *elapsed*, inclusive of today — dividing by the whole cycle would report a
    // rate the user has not reached yet.
    perDay: asOfDay < 0 ? 0 : total / (asOfDay + 1),
    shareOfAllowance: cycle.allowance === 0 ? 0 : total / cycle.allowance,
    topProject: topProject ?? null,
    topModel: topModel ?? null,
  };
}
