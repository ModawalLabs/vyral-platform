/**
 * One page of a larger collection.
 *
 * Mirrors what a paginated API returns — the slice plus enough context to draw
 * the controls without a second request. `page` is what the server actually
 * served, which may differ from what was asked for if the request was out of
 * range.
 */
export type Page<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};
