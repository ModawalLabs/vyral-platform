import { USD_PER_CREDIT } from "@/types/pricing";
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
 *
 * The ledger now reaches back six months so the chart's weekly and monthly views have a
 * range; the cycle-scoped figures are handed only the current cycle's slice by the panel.
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
  /** Total generated length, in seconds. What the credits actually bought. */
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

/**
 * How far each view looks back, and how it is cut.
 *
 * Rolling windows rather than calendar ones — "the last 30 days", not "this month". A
 * calendar month view on the 2nd would be two bars tall and read as a collapse in
 * spending rather than as a month that has barely started.
 */
export const PERIODS = [
  { value: "daily", label: "Daily", buckets: 30, range: "Last 30 days" },
  { value: "weekly", label: "Weekly", buckets: 12, range: "Last 12 weeks" },
  { value: "monthly", label: "Monthly", buckets: 6, range: "Last 6 months" },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

export const periodMeta = (period: Period) =>
  PERIODS.find((entry) => entry.value === period) ?? PERIODS[0];

export type SpendBucket = {
  /** ISO instant the bucket starts at. Stable, so it doubles as a React key. */
  startsAt: string;
  label: string;
  credits: number;
};

/*
 * Everything below works in UTC.
 *
 * The ledger's timestamps are UTC, and bucketing them through the viewer's local
 * timezone would move entries across midnight — a render at 23:00 UTC would land in
 * yesterday's bar for anyone west of Greenwich, and the bars would differ between the
 * server render and the client one. Formatting is pinned to UTC for the same reason.
 */
const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

/** Midnight UTC on the day this instant falls in. */
function startOfDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/** The Monday of the week this instant falls in. */
function startOfWeek(at: Date): Date {
  const day = startOfDay(at);
  // `getUTCDay()` is Sunday-based; shift so Monday is 0 and Sunday is 6.
  const offset = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

function startOfMonth(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
}

/** Which bucket an instant belongs to, for a given period. */
export function bucketStart(at: Date, period: Period): Date {
  if (period === "daily") return startOfDay(at);
  if (period === "weekly") return startOfWeek(at);
  return startOfMonth(at);
}

function stepBack(from: Date, period: Period, steps: number): Date {
  if (period === "monthly") {
    return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - steps, 1));
  }
  const days = period === "weekly" ? steps * 7 : steps;
  return new Date(from.getTime() - days * MS_PER_DAY);
}

function labelFor(start: Date, period: Period): string {
  return period === "monthly" ? MONTH_LABEL.format(start) : DAY_LABEL.format(start);
}

/**
 * Spending, cut into bars.
 *
 * Every bucket in the window is emitted, including the empty ones. A chart that skipped
 * quiet days would put two spikes side by side and imply they were consecutive — the
 * gaps *are* the information, exactly as they were on the line chart this replaced.
 *
 * Oldest first, so the bars read left to right into the present.
 */
export function bucketSpend(
  entries: readonly SpendEntry[],
  period: Period,
  asOf: string,
): SpendBucket[] {
  const { buckets } = periodMeta(period);
  const anchor = bucketStart(new Date(asOf), period);

  const totals = new Map<string, number>();
  const order: string[] = [];

  for (let i = buckets - 1; i >= 0; i--) {
    const key = stepBack(anchor, period, i).toISOString();
    totals.set(key, 0);
    order.push(key);
  }

  for (const entry of entries) {
    const key = bucketStart(new Date(entry.at), period).toISOString();
    // Anything older than the window, or dated after `asOf`, simply has no bucket.
    const current = totals.get(key);
    if (current !== undefined) totals.set(key, current + entry.credits);
  }

  return order.map((startsAt) => ({
    startsAt,
    label: labelFor(new Date(startsAt), period),
    credits: totals.get(startsAt) ?? 0,
  }));
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

/**
 * Credits as money, in cents.
 *
 * Minor units because that is what `formatCurrency` takes, and because rounding once
 * here beats rounding at each of the places that display it. Rounded rather than
 * truncated: a breakdown that consistently reported a penny less than it cost would drift
 * away from the total by a row-count each time.
 */
export function usdFor(credits: number): number {
  return Math.round(credits * USD_PER_CREDIT * 100);
}

/**
 * Seconds as a duration people read.
 *
 * Minutes once past sixty: a busy model can easily total a few hundred seconds, and
 * "312s" is a number you have to do arithmetic on before it means anything. Seconds are
 * kept in the minute form rather than dropped, because at this scale the difference
 * between 1m 5s and 1m 55s is most of a video.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}
