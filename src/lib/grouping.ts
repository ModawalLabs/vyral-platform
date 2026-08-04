export type RecencyGroup<T> = { label: string; items: T[] };

/** Midnight local time, so buckets follow calendar days rather than 24h spans. */
function startOfDay(value: Date | string | number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function labelFor(dayDiff: number) {
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return "Previous 7 days";
  if (dayDiff < 30) return "Previous 30 days";
  return "Older";
}

/**
 * Bucket items into Today / Yesterday / Previous 7 days / Previous 30 days /
 * Older.
 *
 * Deliberately calendar-day based, not elapsed hours: something from 11pm last
 * night is "Yesterday" at 1am even though it is two hours old, and that is what
 * a reader scanning for it expects.
 *
 * Input order is preserved inside each group, and empty groups are dropped —
 * so hand it a list already sorted newest-first.
 *
 * `now` is injectable so callers (and tests) can be deterministic.
 */
export function groupByRecency<T>(
  items: T[],
  getDate: (item: T) => Date | string | number,
  now: Date | number = Date.now(),
): RecencyGroup<T>[] {
  const today = startOfDay(now);
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const dayDiff = Math.round((today - startOfDay(getDate(item))) / 86_400_000);
    const label = labelFor(dayDiff);
    const bucket = buckets.get(label);
    if (bucket) bucket.push(item);
    else buckets.set(label, [item]);
  }

  // Fixed order rather than insertion order, so an out-of-order input list
  // cannot produce "Yesterday" above "Today".
  const ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];
  return ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label)!,
  }));
}
