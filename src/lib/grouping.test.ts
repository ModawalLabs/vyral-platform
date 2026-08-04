import { describe, expect, it } from "vitest";

import { groupByRecency } from "@/lib/grouping";

// Mid-afternoon, so "today" has hours on either side of it.
const NOW = new Date("2026-08-02T15:00:00");

const at = (iso: string) => ({ at: iso });
const group = (items: { at: string }[]) => groupByRecency(items, (i) => i.at, NOW);

describe("groupByRecency", () => {
  it("buckets by calendar day, not elapsed hours", () => {
    // 16 hours apart, but either side of midnight — so different buckets.
    const result = group([at("2026-08-02T01:00:00"), at("2026-08-01T23:00:00")]);
    expect(result.map((g) => g.label)).toEqual(["Today", "Yesterday"]);
  });

  it("covers the full ladder", () => {
    const result = group([
      at("2026-08-02T09:00:00"), // today
      at("2026-08-01T09:00:00"), // yesterday
      at("2026-07-29T09:00:00"), // 4 days
      at("2026-07-20T09:00:00"), // 13 days
      at("2026-06-01T09:00:00"), // 62 days
    ]);
    expect(result.map((g) => g.label)).toEqual([
      "Today",
      "Yesterday",
      "Previous 7 days",
      "Previous 30 days",
      "Older",
    ]);
  });

  it("puts the 7- and 30-day boundaries in the later bucket", () => {
    expect(group([at("2026-07-26T09:00:00")])[0].label).toBe("Previous 30 days");
    expect(group([at("2026-07-03T09:00:00")])[0].label).toBe("Older");
  });

  it("orders groups newest-first even when the input is not sorted", () => {
    const result = group([at("2026-07-20T09:00:00"), at("2026-08-02T09:00:00")]);
    expect(result.map((g) => g.label)).toEqual(["Today", "Previous 30 days"]);
  });

  it("preserves input order inside a group and drops empty ones", () => {
    const result = group([at("2026-08-02T09:00:00"), at("2026-08-02T11:00:00")]);
    expect(result).toHaveLength(1);
    expect(result[0].items.map((i) => i.at)).toEqual([
      "2026-08-02T09:00:00",
      "2026-08-02T11:00:00",
    ]);
  });

  it("treats a future timestamp as today rather than dropping it", () => {
    expect(group([at("2026-08-02T23:00:00")])[0].label).toBe("Today");
  });

  it("returns nothing for an empty list", () => {
    expect(group([])).toEqual([]);
  });
});
