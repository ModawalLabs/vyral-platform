/**
 * Pricing vocabulary and copy.
 *
 * Separate from `src/data/pricing.ts` because that module is `server-only` and this
 * half has to reach the browser: the billing switch and the cards are client
 * components, so the period list and the shared plan copy cannot live behind the
 * server-only guard. Only the price list itself does.
 *
 * Same split as `types/session.ts` versus `data/projects.ts` — shared vocabulary in
 * `types`, the records that will one day be fetched in `data`.
 */

/** The three ways to buy. Matches the landing site's billing switch exactly. */
export const BILLING_PERIODS = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual", note: "Save 20%" },
  { id: "onetime", label: "One Time" },
] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number]["id"];

/** Which tier a plan is. Drives its colour, icon and frame. */
export type PlanTone = "creator" | "pro" | "studio";

export type Plan = {
  tone: PlanTone;
  name: string;
  price: Record<"monthly" | "annual", number>;
  /** Carries the "Most popular" badge — shown on the annual view only. */
  popular?: boolean;
};

export type CreditPack = {
  id: string;
  name: string;
  price: number;
  /** Pre-formatted with thousands separators; nothing computes on it. */
  credits: string;
};

/**
 * Shared deliberately: all three tiers currently list the same features, so one array
 * keeps them from drifting apart by accident. Carried over verbatim from the landing
 * site so the two pages cannot promise different things.
 */
export const PLAN_FEATURES = [
  "AI director & guided workflows",
  "Proof-before-generation previews",
  "Exports tuned for social platforms",
  "Credits that roll month to month",
] as const;

export const PLAN_SUBTITLE =
  "Perfect for beginners who want to explore powerful AI video without a heavy commitment.";

/**
 * Read a billing period off a URL.
 *
 * Deep links aim the switch at a tab — `/upgrade?plan=onetime` from the settings page's
 * Buy credits, because a top-up is a one-off and not a change of plan. Anything
 * unrecognised falls back to the default rather than throwing: a mistyped query string
 * should land you on the pricing page, not on an error.
 *
 * `annual` is the default, as on the landing site — it is the plan to land on, and the
 * only view that shows the "Most popular" badge.
 */
export const DEFAULT_BILLING_PERIOD: BillingPeriod = "annual";

export function parseBillingPeriod(value: string | undefined | null): BillingPeriod {
  const match = BILLING_PERIODS.find((period) => period.id === value);
  return match ? match.id : DEFAULT_BILLING_PERIOD;
}

/**
 * What one credit costs, in dollars.
 *
 * Derived rather than invented: the Studio plan is $79 a month for a 2,000-credit
 * allowance, so that is what a credit is worth to someone on it. Writing it as the
 * division keeps the two numbers it comes from visible — a bare `0.0395` would be a magic
 * constant nobody could check.
 *
 * A single rate is a simplification. A top-up pack is cheaper per credit than the plan
 * allowance (Studio's $79 pack is 17,000 credits), so a real bill blends the two.
 *
 * TODO: from the billing provider, per line item, once it exists.
 */
export const USD_PER_CREDIT = 79 / 2_000;
