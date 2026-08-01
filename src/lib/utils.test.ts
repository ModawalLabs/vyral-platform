import { describe, expect, it } from "vitest";

import { cn, formatCurrency, getErrorMessage } from "@/lib/utils";

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

describe("getErrorMessage", () => {
  it("unwraps Error instances", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("falls back for unknown throwables", () => {
    expect(getErrorMessage({ nope: true })).toMatch(/went wrong/i);
  });
});
