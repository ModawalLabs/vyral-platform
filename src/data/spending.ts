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
 * The ledger, as `[day of August, project id, model, seconds]`.
 *
 * Written this densely because the shape of the *data* is the interesting part and a
 * hundred lines of object literals would bury it. Two things are deliberate in the
 * numbers: `p_01` appears six times, which is what a project that kept getting retaken
 * looks like, and the back half of the month is heavier than the front, so the trailing
 * rate the forecast uses is genuinely different from the cycle average.
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

/**
 * Cost is derived, never stated.
 *
 * `seconds × costPerSecond` from the same `MODEL_PROFILES` the composer prices a job
 * with, so the ranking on this page reflects the trade-off the composer offers rather
 * than a second set of numbers invented for a chart. Retune a model there and the
 * spending breakdown moves with it.
 */
const ENTRIES: SpendEntry[] = LEDGER.map(([day, projectId, model, seconds], index) => ({
  id: `sp_${String(index + 1).padStart(2, "0")}`,
  at: `2026-08-${String(day).padStart(2, "0")}T12:00:00.000Z`,
  projectId,
  projectTitle: PROJECT_TITLES[projectId] ?? "Untitled project",
  model,
  seconds,
  credits: seconds * profileFor(model).costPerSecond,
}));

export async function getSpendCycle(): Promise<SpendCycle> {
  return CYCLE;
}

export async function listSpend(): Promise<SpendEntry[]> {
  // Oldest first: the burn-down accumulates forwards, and every other view sorts for
  // itself anyway.
  return [...ENTRIES].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** What the balance is short by. The one number `getCredits` needs from here. */
export async function spentThisCycle(): Promise<number> {
  return ENTRIES.reduce((sum, entry) => sum + entry.credits, 0);
}
