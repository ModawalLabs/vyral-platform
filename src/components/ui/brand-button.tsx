import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The primary call to action: brand gradient, used once per page at most.
 *
 * Hand-written rather than a `buttonVariants` entry, because that file is
 * shadcn CLI output and gets overwritten by `npx shadcn@latest add`.
 */
export const brandButtonClass = cn(
  "inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent px-4",
  "text-sm font-medium text-brand-foreground shadow-lg shadow-brand/25",
  "transition-[filter,box-shadow] hover:shadow-brand/40 hover:brightness-110",
  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
);

export function BrandButton({ className, ...props }: ComponentProps<"button">) {
  return <button type="button" className={cn(brandButtonClass, className)} {...props} />;
}

/**
 * The same call to action, outlined.
 *
 * For a step that is offered rather than urged: `Generate Scenes` sits above a
 * screenplay you may already be happy with, while `Generate Final Production` is the
 * end of the line and stays filled. Two of the same filled button on one page would
 * have left neither looking like the last word.
 *
 * A 2px edge rather than a hairline, because these run full width and a 1px border
 * stretched across a whole column reads as a divider rather than a button.
 */
export const brandOutlineButtonClass = cn(
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-brand/55 px-4",
  "text-sm font-semibold text-brand-text",
  "transition-colors hover:border-brand hover:bg-brand/10",
  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
);

export function BrandOutlineButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button type="button" className={cn(brandOutlineButtonClass, className)} {...props} />
  );
}

/**
 * Same treatment for a call to action that navigates.
 *
 * A real anchor, not a button with an onClick: middle-click, open-in-new-tab and
 * "copy link" all have to keep working.
 */
export function BrandLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(brandButtonClass, className)} {...props} />;
}
