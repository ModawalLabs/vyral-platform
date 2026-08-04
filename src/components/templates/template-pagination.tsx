import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

import { getPageRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Page controls for the template library.
 *
 * Real links writing `?page=`, not buttons with an `onClick`: the page is a server
 * component that reads the param, so this keeps the URL as the state, survives a
 * reload and a shared link, and works before hydration. It is also why the whole
 * page stays server-rendered — nothing here needs to be a client component.
 *
 * `getPageRange` truncates the list to `1 … 4 5 6 … 10` rather than rendering every
 * page. Three pages needs none of that; forty will.
 */
export function TemplatePagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  // One page is not a pagination.
  if (pageCount <= 1) return null;

  const href = (target: number) => ({ pathname: "/templates", query: { page: target } });

  return (
    <nav
      aria-label="Template pages"
      data-slot="template-pagination"
      className="flex items-center justify-center gap-1.5"
    >
      <Step
        direction="prev"
        href={href(page - 1)}
        disabled={page === 1}
        label="Previous page"
      />

      {getPageRange(page, pageCount).map((token, index) =>
        token === "ellipsis" ? (
          <span
            // Index is a safe key here: the token itself repeats, and the list is
            // regenerated wholesale on every navigation.
            key={`gap-${index}`}
            aria-hidden
            className="grid size-9 place-items-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={token}
            href={href(token)}
            // `aria-current` rather than a class alone: the styling says "here" to
            // sighted users and this says it to everyone else.
            aria-current={token === page ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-lg border text-sm font-medium tabular-nums transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
              token === page
                ? "border-brand/45 bg-brand/15 text-foreground"
                : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {token}
          </Link>
        ),
      )}

      <Step
        direction="next"
        href={href(page + 1)}
        disabled={page === pageCount}
        label="Next page"
      />
    </nav>
  );
}

/**
 * Previous / next.
 *
 * At the ends this renders a `span`, not a disabled link: there is no such thing as
 * a disabled anchor, and leaving it clickable would navigate to `?page=0`.
 */
function Step({
  direction,
  href,
  disabled,
  label,
}: {
  direction: "prev" | "next";
  href: ComponentProps<typeof Link>["href"];
  disabled: boolean;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const base =
    "grid size-9 place-items-center rounded-lg border border-border/70 text-muted-foreground";

  if (disabled) {
    return (
      <span aria-hidden className={cn(base, "opacity-40")}>
        <Icon className="size-4" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        base,
        "transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
      )}
    >
      <Icon className="size-4" />
    </Link>
  );
}
