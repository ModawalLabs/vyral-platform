/**
 * A remixable starting point in the template library.
 *
 * This is the contract the Templates UI renders against — shape the API response
 * to match (or map to it in `src/data/templates.ts`) and every card populates
 * without touching a component.
 *
 * `aspectRatio` is deliberately the same union as `Project`: it is the same idea
 * (the shape of the finished video) and the grid lays a card out from it.
 */
export type Template = {
  id: string;
  title: string;
  /** Short grouping label shown on the card — "Product", "Social", and so on. */
  category: string;
  /** Preview still. Absent for now; the card draws its placeholder instead. */
  thumbnailUrl?: string;
  aspectRatio: "16:8" | "8:16";
  durationSeconds: number;
  /** How many times it has been remixed. Drives the only number on the card. */
  uses: number;
};
