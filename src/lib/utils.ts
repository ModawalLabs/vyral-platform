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

export function formatNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
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
