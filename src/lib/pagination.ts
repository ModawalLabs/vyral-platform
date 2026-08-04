export type PageToken = number | "ellipsis";

/**
 * The compact page list: first, last, the current page with `siblings` either
 * side, and ellipses standing in for the gaps.
 *
 * Written for the case that does not exist yet — ten chats is two pages and
 * needs no truncation, but a real library will be forty, and a control that
 * renders forty buttons is not one anybody wants to retrofit.
 */
export function getPageRange(
  current: number,
  pageCount: number,
  siblings = 1,
): PageToken[] {
  if (pageCount <= 0) return [];
  if (pageCount === 1) return [1];

  const start = Math.max(2, current - siblings);
  const end = Math.min(pageCount - 1, current + siblings);

  const tokens: PageToken[] = [1];
  if (start > 2) tokens.push("ellipsis");
  for (let page = start; page <= end; page++) tokens.push(page);
  if (end < pageCount - 1) tokens.push("ellipsis");
  tokens.push(pageCount);

  return tokens;
}

/** Clamp a requested page into range; anything unparseable falls back to 1. */
export function resolvePage(requested: string | undefined, pageCount: number) {
  const parsed = Number.parseInt(requested ?? "", 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(1, parsed), Math.max(1, pageCount));
}
