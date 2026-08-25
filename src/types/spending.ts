/**
 * One render, and what it cost.
 *
 * A flat ledger rather than pre-aggregated totals, because every view on the settings
 * page is a fold over this same list — the burn-down, the per-project ranking, the
 * per-model ranking and the drill-down between them. Shipping summaries instead would
 * mean the API had to know in advance every way anyone would ever want to cut it, and
 * the moment two summaries disagreed there would be no way to tell which was right.
 *
 * `projectTitle` is denormalised on purpose. The ledger is read by a client component
 * that has no access to the project library, and re-fetching ten projects to label ten
 * rows would be a join done in the browser.
 */
export type SpendEntry = {
  id: string;
  /** ISO 8601. When the render was billed. */
  at: string;
  projectId: string;
  projectTitle: string;
  /** As it appears in the composer — see `MODEL_PROFILES`. */
  model: string;
  /** Output length. What `credits` is derived from, and what makes it explicable. */
  seconds: number;
  credits: number;
};

/**
 * The billing window the ledger covers.
 *
 * `asOf` rather than "now": the whole page is drawn against a fixed point so the chart
 * does not quietly redraw itself between a screenshot and a bug report. The real API
 * supplies today's date here.
 */
export type SpendCycle = {
  startsAt: string;
  renewsAt: string;
  asOf: string;
  allowance: number;
};
