import { describe, expect, it } from "vitest";

import {
  BILLING_PERIODS,
  DEFAULT_BILLING_PERIOD,
  parseBillingPeriod,
} from "@/types/pricing";

describe("parseBillingPeriod", () => {
  it("accepts every id the switch offers", () => {
    for (const period of BILLING_PERIODS) {
      expect(parseBillingPeriod(period.id)).toBe(period.id);
    }
  });

  it("is the link the settings page relies on", () => {
    // Buy credits deep-links to `?plan=onetime`; if this id ever drifts the button
    // silently lands on the annual cards instead.
    expect(parseBillingPeriod("onetime")).toBe("onetime");
  });

  it("falls back rather than throwing on anything unrecognised", () => {
    for (const value of [undefined, null, "", "ONETIME", "yearly", "one-time"]) {
      expect(parseBillingPeriod(value)).toBe(DEFAULT_BILLING_PERIOD);
    }
  });
});
