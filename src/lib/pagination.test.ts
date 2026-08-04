import { describe, expect, it } from "vitest";

import { getPageRange, resolvePage } from "@/lib/pagination";

describe("getPageRange", () => {
  it("lists every page when there is nothing to truncate", () => {
    expect(getPageRange(1, 2)).toEqual([1, 2]);
    expect(getPageRange(2, 3)).toEqual([1, 2, 3]);
  });

  it("truncates on the far side only", () => {
    expect(getPageRange(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageRange(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("truncates both sides in the middle", () => {
    expect(getPageRange(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("never emits an ellipsis standing in for a single page", () => {
    // Page 3 of 5 with one sibling reaches 2..4, so 1 and 5 close the gaps.
    expect(getPageRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("widens with more siblings", () => {
    expect(getPageRange(5, 10, 2)).toEqual([
      1,
      "ellipsis",
      3,
      4,
      5,
      6,
      7,
      "ellipsis",
      10,
    ]);
  });

  it("handles the degenerate counts", () => {
    expect(getPageRange(1, 1)).toEqual([1]);
    expect(getPageRange(1, 0)).toEqual([]);
  });
});

describe("resolvePage", () => {
  it("defaults to the first page", () => {
    expect(resolvePage(undefined, 3)).toBe(1);
    expect(resolvePage("", 3)).toBe(1);
    expect(resolvePage("banana", 3)).toBe(1);
  });

  it("clamps out-of-range requests instead of rendering nothing", () => {
    expect(resolvePage("0", 3)).toBe(1);
    expect(resolvePage("-4", 3)).toBe(1);
    expect(resolvePage("999", 3)).toBe(3);
  });

  it("passes valid pages through", () => {
    expect(resolvePage("2", 3)).toBe(2);
  });
});
