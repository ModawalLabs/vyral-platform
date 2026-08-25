/**
 * Initials for an account chip, from its handle.
 *
 * `@vyral.studio` → `VS`. Splits on the separators handles actually use, so a dotted or
 * hyphenated handle gives two letters and a plain one gives its first two.
 *
 * Shared because two unrelated surfaces draw the same chip: Settings lists the accounts
 * linked to each platform, and the export publisher lists them again as publish targets.
 * Two copies would eventually disagree about what `@vyral_bts` abbreviates to.
 */
export function initialsFor(handle: string) {
  const parts = handle
    .replace(/^@/, "")
    .split(/[.\-_]/)
    .filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
