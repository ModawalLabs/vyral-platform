import { describe, expect, it, vi } from "vitest";

import {
  bucketSpend,
  cycleSummary,
  dayIndex,
  entriesFor,
  groupSpend,
  otherDimension,
  formatDuration,
  totalCredits,
  usdFor,
} from "@/components/settings/spending";
import type { SpendCycle, SpendEntry } from "@/types/spending";

/*
 * `server-only` throws outside a React Server Component, and one test below reads the
 * real ledger. The guard exists to keep the module out of the client bundle, which is a
 * bundling concern — stubbing it here does not weaken it, and the alternative is a
 * second copy of the mock data that could drift from the one that ships.
 */
vi.mock("server-only", () => ({}));

const CYCLE: SpendCycle = {
  startsAt: "2026-08-01T00:00:00.000Z",
  renewsAt: "2026-09-01T00:00:00.000Z",
  asOf: "2026-08-10T00:00:00.000Z",
  allowance: 1_000,
};

const entry = (
  day: number,
  projectId: string,
  model: string,
  credits: number,
  seconds = credits,
): SpendEntry => ({
  id: `e_${day}_${projectId}_${model}_${credits}`,
  at: `2026-08-${String(day).padStart(2, "0")}T12:00:00.000Z`,
  projectId,
  projectTitle: projectId === "p_1" ? "Alpha" : "Bravo",
  model,
  seconds,
  credits,
});

const LEDGER: SpendEntry[] = [
  entry(1, "p_1", "Veo3", 100),
  entry(3, "p_1", "Seedance", 20),
  entry(3, "p_2", "Veo3", 60),
  entry(9, "p_2", "Veo3", 40),
  entry(10, "p_1", "Veo3", 80),
];

describe("dayIndex", () => {
  it("counts whole days from the start of the cycle, zero-based", () => {
    expect(dayIndex("2026-08-01T00:00:00.000Z", CYCLE)).toBe(0);
    expect(dayIndex("2026-08-01T23:59:00.000Z", CYCLE)).toBe(0);
    expect(dayIndex("2026-08-10T12:00:00.000Z", CYCLE)).toBe(9);
    expect(dayIndex(CYCLE.renewsAt, CYCLE)).toBe(31);
  });
});

describe("groupSpend", () => {
  it("ranks by credits and carries render and second counts", () => {
    expect(groupSpend(LEDGER, "project")).toEqual([
      {
        key: "p_1",
        label: "Alpha",
        credits: 200,
        share: 200 / 300,
        renders: 3,
        seconds: 200,
      },
      {
        key: "p_2",
        label: "Bravo",
        credits: 100,
        share: 100 / 300,
        renders: 2,
        seconds: 100,
      },
    ]);
  });

  it("cuts the same ledger by model", () => {
    expect(groupSpend(LEDGER, "model").map((g) => [g.key, g.credits])).toEqual([
      ["Veo3", 280],
      ["Seedance", 20],
    ]);
  });

  it("measures share against what it was handed, not the whole cycle", () => {
    // The point of the drill-down: inside Alpha, Veo3 is 90% *of Alpha*.
    const alpha = entriesFor(LEDGER, "project", "p_1");
    const byModel = groupSpend(alpha, "model");
    expect(byModel.map((g) => [g.key, Math.round(g.share * 100)])).toEqual([
      ["Veo3", 90],
      ["Seedance", 10],
    ]);
  });

  it("returns no groups, and no NaN shares, for an empty ledger", () => {
    expect(groupSpend([], "project")).toEqual([]);
  });

  it("breaks a credit tie on the label so rows do not swap between renders", () => {
    const tied = [entry(1, "p_2", "Kling", 50), entry(1, "p_1", "Kling", 50)];
    expect(groupSpend(tied, "project").map((g) => g.label)).toEqual(["Alpha", "Bravo"]);
  });
});

describe("otherDimension", () => {
  it("is its own inverse", () => {
    expect(otherDimension("project")).toBe("model");
    expect(otherDimension(otherDimension("project"))).toBe("project");
  });
});

describe("cycleSummary", () => {
  it("averages over days elapsed, not over the whole cycle", () => {
    const summary = cycleSummary(LEDGER, CYCLE);
    expect(summary.total).toBe(300);
    expect(summary.renders).toBe(5);
    // Ten days have passed of a thirty-one day cycle.
    expect(summary.perDay).toBe(30);
    expect(summary.shareOfAllowance).toBe(0.3);
    expect(summary.topProject?.label).toBe("Alpha");
    expect(summary.topModel?.key).toBe("Veo3");
  });

  it("survives an empty cycle", () => {
    const summary = cycleSummary([], CYCLE);
    expect(summary).toMatchObject({
      total: 0,
      renders: 0,
      topProject: null,
      topModel: null,
    });
  });
});

describe("the shipped mock", () => {
  it("agrees with the balance about the cycle it covers", async () => {
    const { getCredits } = await import("@/data/account");
    const { getSpendCycle } = await import("@/data/spending");
    const [credits, cycle] = await Promise.all([getCredits(), getSpendCycle()]);

    expect(credits.allowance).toBe(cycle.allowance);
    expect(credits.renewsAt).toBe(cycle.renewsAt);
  });

  it("prices every render off the composer's own model profiles", async () => {
    const { listSpend } = await import("@/data/spending");
    const { profileFor } = await import("@/lib/session/models");

    for (const item of await listSpend()) {
      expect(item.credits).toBe(item.seconds * profileFor(item.model).costPerSecond);
    }
  });

  it("never dates an entry after the day it claims to be current to", async () => {
    /*
     * This used to assert the whole ledger sat *inside* the cycle. It no longer does —
     * six months of history were added so the chart's weekly and monthly views have a
     * range — but the future half of that bound still matters: an entry dated ahead of
     * `asOf` would land in no bucket and silently vanish from the chart.
     */
    const { listSpend, getSpendCycle } = await import("@/data/spending");
    const cycle = await getSpendCycle();

    for (const item of await listSpend()) {
      expect(dayIndex(item.at, cycle)).toBeLessThanOrEqual(dayIndex(cycle.asOf, cycle));
    }
  });
});

describe("usdFor", () => {
  it("prices credits off the plan they came with", () => {
    // $79 a month for a 2,000-credit allowance, in cents.
    expect(usdFor(2_000)).toBe(7_900);
    expect(usdFor(760)).toBe(3_002);
  });

  it("returns whole cents, so a column of rows cannot show a fraction of one", () => {
    for (const credits of [1, 7, 13, 137, 999]) {
      expect(Number.isInteger(usdFor(credits))).toBe(true);
    }
  });

  it("is zero for nothing spent", () => {
    expect(usdFor(0)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("stays in seconds below a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("switches to minutes, keeping the remaining seconds", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(85)).toBe("1m 25s");
    expect(formatDuration(312)).toBe("5m 12s");
  });

  it("drops a zero remainder rather than printing 2m 0s", () => {
    expect(formatDuration(120)).toBe("2m");
  });
});

describe("bucketSpend", () => {
  const AS_OF = "2026-08-24T00:00:00.000Z";

  const on = (iso: string, credits: number): SpendEntry => ({
    id: iso + credits,
    at: iso,
    projectId: "p_1",
    projectTitle: "Alpha",
    model: "Veo3",
    seconds: credits,
    credits,
  });

  it("emits the whole window, empty buckets included", () => {
    // The gaps are the information: a chart that skipped quiet days would put two
    // spikes side by side and imply they were consecutive.
    const daily = bucketSpend([on("2026-08-24T12:00:00.000Z", 40)], "daily", AS_OF);
    expect(daily).toHaveLength(30);
    expect(daily.filter((b) => b.credits > 0)).toHaveLength(1);
    expect(daily.at(-1)).toMatchObject({ credits: 40, label: "24 Aug" });
  });

  it("runs oldest first, ending on the day of `asOf`", () => {
    const daily = bucketSpend([], "daily", AS_OF);
    expect(daily[0].startsAt).toBe("2026-07-26T00:00:00.000Z");
    expect(daily.at(-1)!.startsAt).toBe("2026-08-24T00:00:00.000Z");
  });

  it("buckets a day by its UTC date, whatever the time of day", () => {
    const daily = bucketSpend(
      [on("2026-08-20T00:00:00.000Z", 10), on("2026-08-20T23:59:59.000Z", 5)],
      "daily",
      AS_OF,
    );
    expect(daily.find((b) => b.startsAt === "2026-08-20T00:00:00.000Z")?.credits).toBe(
      15,
    );
  });

  it("starts weeks on Monday", () => {
    // 24 Aug 2026 is a Monday, so it opens its own week; 23 Aug is the Sunday before
    // and belongs to the previous one.
    const weekly = bucketSpend(
      [on("2026-08-24T12:00:00.000Z", 10), on("2026-08-23T12:00:00.000Z", 7)],
      "weekly",
      AS_OF,
    );
    expect(weekly).toHaveLength(12);
    expect(weekly.at(-1)).toMatchObject({
      startsAt: "2026-08-24T00:00:00.000Z",
      credits: 10,
    });
    expect(weekly.at(-2)).toMatchObject({
      startsAt: "2026-08-17T00:00:00.000Z",
      credits: 7,
    });
  });

  it("cuts months on the first, and steps back by calendar month", () => {
    const monthly = bucketSpend(
      [on("2026-08-01T00:00:00.000Z", 9), on("2026-03-31T23:00:00.000Z", 4)],
      "monthly",
      AS_OF,
    );
    expect(monthly).toHaveLength(6);
    expect(monthly.map((b) => b.label)).toEqual([
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
    ]);
    // Month lengths differ, so stepping back by 30 days would have drifted off the 1st.
    expect(monthly[0]).toMatchObject({
      startsAt: "2026-03-01T00:00:00.000Z",
      credits: 4,
    });
    expect(monthly.at(-1)?.credits).toBe(9);
  });

  it("drops anything outside the window rather than piling it on an edge bucket", () => {
    const monthly = bucketSpend([on("2025-01-01T00:00:00.000Z", 500)], "monthly", AS_OF);
    expect(monthly.every((b) => b.credits === 0)).toBe(true);

    // ...and the same for a future-dated entry, which has no bucket either.
    const daily = bucketSpend([on("2026-09-05T00:00:00.000Z", 500)], "daily", AS_OF);
    expect(daily.every((b) => b.credits === 0)).toBe(true);
  });
});

describe("the shipped ledger, against the chart", () => {
  it("reaches back far enough for every period to have a range", async () => {
    const { listSpend, getSpendCycle } = await import("@/data/spending");
    const [spend, cycle] = await Promise.all([listSpend(), getSpendCycle()]);

    for (const period of ["daily", "weekly", "monthly"] as const) {
      const buckets = bucketSpend(spend, period, cycle.asOf);
      const filled = buckets.filter((b) => b.credits > 0).length;
      // Not merely "some data" — most of the window has to be populated, or the chart
      // is a couple of bars floating in an empty plot.
      expect(filled).toBeGreaterThanOrEqual(Math.ceil(buckets.length / 2));
    }
  });

  it("keeps the balance scoped to the cycle despite the history", async () => {
    const { getCredits } = await import("@/data/account");
    const { listSpend, getSpendCycle } = await import("@/data/spending");
    const [credits, spend, cycle] = await Promise.all([
      getCredits(),
      listSpend(),
      getSpendCycle(),
    ]);

    /*
     * The regression this guards: the ledger grew six months of history, and summing
     * all of it into the balance drove `available` negative — the ring would have shown
     * a full turn of overdraft on a plan that is 62% unused.
     */
    const inCycle = spend.filter((e) => e.at >= cycle.startsAt && e.at < cycle.renewsAt);
    expect(totalCredits(inCycle)).toBe(credits.allowance - credits.available);
    expect(credits.available).toBeGreaterThan(0);
    // ...and there really is history outside it, or this asserts nothing.
    expect(spend.length).toBeGreaterThan(inCycle.length);
  });
});
