import { describe, expect, it } from "vitest";

import { cn, formatCurrency, formatRelativeTime, getErrorMessage } from "@/lib/utils";

describe("cn", () => {
  it("keeps the last conflicting Tailwind utility", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("flex", false && "hidden", undefined, "gap-2")).toBe("flex gap-2");
  });
});

describe("formatCurrency", () => {
  it("renders minor units as major currency", () => {
    expect(formatCurrency(1999)).toBe("$19.99");
  });
});

describe("formatRelativeTime", () => {
  // Fixed `now` so the assertions do not depend on when the suite runs.
  const now = new Date("2026-08-02T12:00:00.000Z");

  it("picks the largest fitting unit", () => {
    expect(formatRelativeTime("2026-07-30T12:00:00.000Z", now)).toBe("3 days ago");
    expect(formatRelativeTime("2026-08-02T09:00:00.000Z", now)).toBe("3 hours ago");
  });

  it("uses friendly wording at unit boundaries", () => {
    expect(formatRelativeTime("2026-08-01T12:00:00.000Z", now)).toBe("yesterday");
  });

  it("handles future timestamps", () => {
    expect(formatRelativeTime("2026-08-04T12:00:00.000Z", now)).toBe("in 2 days");
  });

  it("falls back to seconds below a minute", () => {
    expect(formatRelativeTime("2026-08-02T11:59:30.000Z", now)).toBe("30 seconds ago");
  });
});

describe("getErrorMessage", () => {
  it("unwraps Error instances", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("falls back for unknown throwables", () => {
    expect(getErrorMessage({ nope: true })).toMatch(/went wrong/i);
  });
});
