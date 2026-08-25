import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build an absolute URL from an app-relative path. */
export function absoluteUrl(path: string, baseUrl: string) {
  return new URL(path, baseUrl).toString();
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-US",
) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatCurrency(
  amountInMinorUnits: number,
  currency = "USD",
  locale = "en-US",
) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amountInMinorUnits / 100,
  );
}

/** Compact: "1.2K". For counts where the magnitude matters and the digits do not. */
export function formatNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
}

/**
 * Grouped in full: "1,240".
 *
 * The counterpart to `formatNumber`, and the right one for anything a person is meant
 * to reconcile — a credit balance, a ledger total, an axis on a chart. "1.2K remaining"
 * next to a breakdown adding up to 1,240 reads as two different numbers.
 */
export function formatInteger(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

const RELATIVE_UNITS = [
  { unit: "year", ms: 31_536_000_000 },
  { unit: "month", ms: 2_592_000_000 },
  { unit: "week", ms: 604_800_000 },
  { unit: "day", ms: 86_400_000 },
  { unit: "hour", ms: 3_600_000 },
  { unit: "minute", ms: 60_000 },
] as const;

/**
 * "3 days ago" / "in 2 hours".
 *
 * `now` is injectable so callers can render deterministically — the default of
 * reading the clock is fine on the server, but a client component that
 * re-renders would drift from the server's markup.
 */
export function formatRelativeTime(
  date: Date | string | number,
  now: Date | number = Date.now(),
  locale = "en-US",
) {
  const deltaMs = new Date(date).getTime() - new Date(now).getTime();
  const absMs = Math.abs(deltaMs);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absMs >= ms) {
      return formatter.format(Math.round(deltaMs / ms), unit);
    }
  }
  return formatter.format(Math.round(deltaMs / 1000), "second");
}

/** Narrow an unknown thrown value to a message without losing non-Error cases. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
