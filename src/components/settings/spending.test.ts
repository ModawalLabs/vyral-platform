import { describe, expect, it, vi } from "vitest";

import {
  burnDown,
  cycleSummary,
  dayIndex,
  entriesFor,
  forecast,
  groupSpend,
  otherDimension,
  RATE_WINDOW_DAYS,
  totalCredits,
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

describe("burnDown", () => {
  const points = burnDown(LEDGER, CYCLE);

  it("emits one point per elapsed day, including the quiet ones", () => {
    // Days 0–9 inclusive. The flat stretch from day 4 to day 8 is the whole reason
    // every day gets a point — skipping them would draw a straight ramp across it.
    expect(points).toHaveLength(10);
    expect(points.map((p) => p.day)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(points.slice(3, 8).map((p) => p.remaining)).toEqual([820, 820, 820, 820, 820]);
  });

  it("never goes up, and ends at the balance the ledger implies", () => {
    for (let i = 1; i < points.length; i++) {
      expect(points[i].remaining).toBeLessThanOrEqual(points[i - 1].remaining);
    }
    expect(points[points.length - 1].remaining).toBe(
      CYCLE.allowance - totalCredits(LEDGER),
    );
  });

  it("ignores entries outside the elapsed window", () => {
    const withFuture = [...LEDGER, entry(20, "p_1", "Veo3", 500)];
    const last = burnDown(withFuture, CYCLE).at(-1)!;
    expect(last.remaining).toBe(700);
  });
});

describe("forecast", () => {
  it("rates from the trailing week, not the cycle average", () => {
    // 700 of the 800 credits landed on days 0–3; only 120 in the trailing window.
    const out = forecast(LEDGER, CYCLE);
    expect(RATE_WINDOW_DAYS).toBe(7);
    expect(out.perDay).toBeCloseTo(120 / 7, 5);
    expect(out.remaining).toBe(700);
    expect(out.daysLeft).toBe(22);
  });

  it("reports the surplus when the pace does not exhaust the balance", () => {
    const out = forecast(LEDGER, CYCLE);
    expect(out.runsOutOnDay).toBeNull();
    expect(out.remainingAtRenewal).toBeCloseTo(700 - (120 / 7) * 22, 5);
  });

  it("reports the day it runs out when the recent pace is heavy enough", () => {
    // A hard week: 600 credits over days 4–10 leaves 100 and a rate that eats it in
    // just over a day.
    const heavy = [
      entry(1, "p_1", "Veo3", 300),
      entry(6, "p_1", "Veo3", 300),
      entry(8, "p_1", "Veo3", 300),
    ];
    const out = forecast(heavy, CYCLE);
    expect(out.remaining).toBe(100);
    expect(out.perDay).toBeCloseTo(600 / 7, 5);
    expect(out.runsOutOnDay).not.toBeNull();
    expect(out.runsOutOnDay!).toBeCloseTo(9 + 100 / (600 / 7), 5);
    // ...and that day is inside the cycle, which is what makes it worth saying.
    expect(out.runsOutOnDay!).toBeLessThan(out.cycleDays);
  });

  it("shortens the window rather than reaching back before the cycle started", () => {
    const early: SpendCycle = { ...CYCLE, asOf: "2026-08-02T00:00:00.000Z" };
    // Two days elapsed, 100 credits spent on day 0 — a rate of 50/day, not 100/7.
    const out = forecast([entry(1, "p_1", "Veo3", 100)], early);
    expect(out.perDay).toBe(50);
  });

  it("never projects a negative balance", () => {
    const out = forecast([entry(9, "p_1", "Veo3", 900)], CYCLE);
    expect(out.remainingAtRenewal).toBe(0);
  });

  it("does not forecast a run-out from a standing start", () => {
    const out = forecast([], CYCLE);
    expect(out.perDay).toBe(0);
    expect(out.runsOutOnDay).toBeNull();
    expect(out.remainingAtRenewal).toBe(CYCLE.allowance);
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
  it("adds up to exactly the credits the balance says are gone", async () => {
    /*
     * The reconciliation that makes the page trustworthy.
     *
     * The ring gauge and these charts are two views of one number. This asserts they
     * are derived from the same place — if the ledger and the balance ever disagree,
     * one of the two figures on screen is a lie and there is no way to tell which.
     */
    const { getCredits } = await import("@/data/account");
    const { listSpend, getSpendCycle } = await import("@/data/spending");

    const [credits, spend, cycle] = await Promise.all([
      getCredits(),
      listSpend(),
      getSpendCycle(),
    ]);

    expect(totalCredits(spend)).toBe(credits.allowance - credits.available);
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

  it("lands entirely inside the cycle it claims to cover", async () => {
    const { listSpend, getSpendCycle } = await import("@/data/spending");
    const cycle = await getSpendCycle();

    for (const item of await listSpend()) {
      const day = dayIndex(item.at, cycle);
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(dayIndex(cycle.asOf, cycle));
    }
  });
});
