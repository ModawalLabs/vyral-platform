import "server-only";

import { profileFor } from "@/lib/session/models";
import type { SpendCycle, SpendEntry } from "@/types/spending";

/**
 * Spending data access.
 *
 * The only file that changes when billing lands: keep these signatures and replace the
 * bodies. `server-only` keeps the mock — and later the billing provider's credentials —
 * out of the browser bundle.
 *
 * This module is the source of truth for how many credits have been used. `getCredits`
 * in `src/data/account.ts` derives its balance from `spentThisCycle()` rather than
 * carrying its own figure, so the ring gauge and these charts cannot disagree. That
 * direction matters: a ledger that does not add up to the balance beside it is worse
 * than no ledger, because it makes both numbers untrustworthy.
 */

const CYCLE: SpendCycle = {
  startsAt: "2026-08-01T00:00:00.000Z",
  renewsAt: "2026-09-01T00:00:00.000Z",
  // Fixed rather than `new Date()`: the chart must not redraw itself between a
  // screenshot and the bug report about it. TODO: today's date, from the server.
  asOf: "2026-08-24T00:00:00.000Z",
  allowance: 2_000,
};

/** Titles, keyed by the ids in `src/data/projects.ts`. TODO: a real join. */
const PROJECT_TITLES: Record<string, string> = {
  p_01: "Neon alley chase",
  p_02: "Espresso pour, macro",
  p_03: "Black sand aerial",
  p_04: "VHS birthday party",
  p_05: "Paper crane flock",
  p_06: "Studio pedestal spin",
  p_07: "Golden hour field",
  p_08: "Rooftop timelapse",
  p_09: "Sneaker drop teaser",
  p_10: "Cliffside drone pull",
};

/**
 * The models the mock draws from, and what each costs a second.
 *
 * Read back out of `profileFor` rather than restated, so this cannot drift from the
 * composer's own pricing — the same reason `credits` is derived below rather than typed
 * in.
 */
const MODEL_COSTS = {
  Veo3: profileFor("Veo3").costPerSecond,
  "Kling T2V": profileFor("Kling T2V").costPerSecond,
  Kling: profileFor("Kling").costPerSecond,
  Seedance: profileFor("Seedance").costPerSecond,
  "Happy Horse": profileFor("Happy Horse").costPerSecond,
  Hunyuan: profileFor("Hunyuan").costPerSecond,
};

/**
 * Everything before the current cycle.
 *
 * The chart looks back six months; the ledger only ever held the current one, so a
 * monthly view of it was a single bar. Generated rather than hand-authored because a
 * hundred and fifty line items would bury the twenty-six that actually matter — the
 * August ones, which are what the credits balance is derived from.
 *
 * **Seeded, not random.** `Math.random()` here would differ between the server render and
 * the client one — a hydration mismatch — and would redraw the chart on every re-render,
 * so the same month would report a different total each time you switched the period.
 * A tiny LCG gives numbers that look unstructured and never move.
 */
function seeded(seed: number) {
  let state = seed >>> 0;
  return (max: number) => {
    // Numerical Recipes' constants. The point is reproducibility, not statistical
    // quality — nothing here is cryptographic or even really random.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % max;
  };
}

/** March through July 2026. August is the current cycle and is authored by hand below. */
const HISTORY_MONTHS = [2, 3, 4, 5, 6];

const PROJECT_IDS = Object.keys(PROJECT_TITLES);
const MODELS = Object.keys(MODEL_COSTS) as Array<keyof typeof MODEL_COSTS>;

function historicalLedger(): Array<readonly [string, string, string, number]> {
  const next = seeded(20_260_301);
  const rows: Array<readonly [string, string, string, number]> = [];

  for (const month of HISTORY_MONTHS) {
    // Twelve to twenty-three renders a month — enough that a weekly bucket is never
    // empty, varied enough that the bars are not a flat wall.
    const count = 12 + next(12);

    for (let i = 0; i < count; i++) {
      // The real length of this month. Capping at 28 was simpler but left the 29th to
      // the 31st permanently empty, which shows up as a dead zone at the end of every
      // month the moment the daily window crosses one.
      const daysInMonth = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate();
      const day = 1 + next(daysInMonth);
      rows.push([
        `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00.000Z`,
        PROJECT_IDS[next(PROJECT_IDS.length)],
        MODELS[next(MODELS.length)],
        6 + next(10),
      ]);
    }
  }

  return rows;
}

/**
 * The ledger, as `[day of August, project id, model, seconds]`.
 *
 * Written this densely because the shape of the *data* is the interesting part and a
 * hundred lines of object literals would bury it. Two things are deliberate in the
 * numbers: `p_01` appears six times, which is what a project that kept getting retaken
 * looks like, and the back half of the month is heavier than the front, so the daily bars
 * are not a flat wall.
 *
 * TODO: gone the moment the billing provider returns real line items.
 */
const LEDGER: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, "p_01", "Veo3", 10],
  [1, "p_01", "Veo3", 10],
  [2, "p_02", "Seedance", 8],
  [2, "p_02", "Kling", 8],
  [3, "p_03", "Kling T2V", 12],
  [4, "p_04", "Hunyuan", 15],
  [5, "p_05", "Seedance", 6],
  [6, "p_01", "Veo3", 10],
  [8, "p_06", "Kling", 9],
  [9, "p_07", "Happy Horse", 11],
  [10, "p_08", "Kling T2V", 14],
  [12, "p_09", "Seedance", 10],
  [13, "p_10", "Kling", 13],
  [14, "p_02", "Veo3", 8],
  [15, "p_03", "Hunyuan", 12],
  [16, "p_04", "Kling", 15],
  [18, "p_01", "Veo3", 10],
  [19, "p_01", "Kling T2V", 10],
  [20, "p_08", "Veo3", 14],
  [21, "p_05", "Seedance", 6],
  [21, "p_07", "Hunyuan", 11],
  [22, "p_10", "Veo3", 13],
  [23, "p_08", "Kling T2V", 14],
  [23, "p_09", "Happy Horse", 7],
  [24, "p_01", "Veo3", 10],
  [24, "p_06", "Kling", 9],
];

/** History and the current cycle, in one representation: `[iso, project, model, seconds]`. */
const ALL_ROWS: Array<readonly [string, string, string, number]> = [
  ...historicalLedger(),
  ...LEDGER.map(
    ([day, projectId, model, seconds]) =>
      [
        `2026-08-${String(day).padStart(2, "0")}T12:00:00.000Z`,
        projectId,
        model,
        seconds,
      ] as const,
  ),
];

/**
 * Cost is derived, never stated.
 *
 * `seconds × costPerSecond` from the same `MODEL_PROFILES` the composer prices a job
 * with, so the ranking on this page reflects the trade-off the composer offers rather
 * than a second set of numbers invented for a chart. Retune a model there and the
 * spending breakdown moves with it.
 */
const ENTRIES: SpendEntry[] = ALL_ROWS.map(([at, projectId, model, seconds], index) => ({
  id: `sp_${String(index + 1).padStart(3, "0")}`,
  at,
  projectId,
  projectTitle: PROJECT_TITLES[projectId] ?? "Untitled project",
  model,
  seconds,
  credits: seconds * profileFor(model).costPerSecond,
}));

/** Inside the window the allowance covers. Start inclusive, renewal exclusive. */
const inCurrentCycle = (entry: SpendEntry) =>
  entry.at >= CYCLE.startsAt && entry.at < CYCLE.renewsAt;

export async function getSpendCycle(): Promise<SpendCycle> {
  return CYCLE;
}

export async function listSpend(): Promise<SpendEntry[]> {
  // Oldest first, which is the order the chart draws its bars in. Every other view
  // sorts for itself anyway.
  return [...ENTRIES].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** What the balance is short by. The one number `getCredits` needs from here. */
export async function spentThisCycle(): Promise<number> {
  // Only this cycle. The ledger now reaches back six months for the chart, and summing
  // all of it here would have driven the balance — and the ring beside it — negative.
  return ENTRIES.filter(inCurrentCycle).reduce((sum, entry) => sum + entry.credits, 0);
}
