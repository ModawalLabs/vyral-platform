import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A navigation link that looks like a button.
 *
 * Deliberately built from `buttonVariants` rather than the Button primitive:
 * Base UI stamps `role="button"` on any non-native element it renders, which
 * would strip the anchor's link semantics (screen readers announce it wrong,
 * and middle-click/open-in-new-tab stop being discoverable).
 */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      data-slot="button-link"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
