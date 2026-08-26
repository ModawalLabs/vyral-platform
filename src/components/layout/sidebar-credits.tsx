"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CreditRing } from "@/components/credits/credit-ring";
import { routes } from "@/config/routes";
import { cn, formatDate, formatInteger } from "@/lib/utils";
import type { CreditBalance } from "@/types/account";

/**
 * The balance, always in view.
 *
 * Credits are the thing that stops you working, and until now the only place to see them
 * was the settings page — two clicks from anywhere. A dial in the footer makes the
 * proportion glanceable from every screen, which is the whole reason it is a ring rather
 * than a line of text: you read "getting low" off the arc without reading the number.
 *
 * The whole block is one link to the upgrade page, aimed at the One Time tab. A balance
 * you have just looked at because it is low leads to a top-up, not to a change of plan —
 * same reasoning as the settings card's Buy credits, and the two now agree.
 *
 * Ring, not the number, at 56px: a ring small enough to fit 232px of sidebar cannot also
 * hold a legible four-digit figure inside it, so the arc carries the proportion and the
 * text beside it carries the digits.
 */
export function SidebarCredits({
  credits,
  collapsed,
}: {
  credits: CreditBalance;
  collapsed: boolean;
}) {
  const { available, allowance } = credits;
  const valueText = `${formatInteger(available)} of ${formatInteger(allowance)} credits remaining`;

  const href = { pathname: routes.upgrade, query: { plan: "onetime" } } as const;

  if (collapsed) {
    return (
      <Link
        href={href}
        title={`${valueText} — buy more`}
        aria-label={`${valueText}. Buy more credits.`}
        data-slot="sidebar-credits"
        data-collapsed="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
      >
        {/*
          A heavier stroke than the settings gauge. Stroke width is in viewBox units, so
          a 12-unit ring rendered at 36px is a 3.6px hairline — 18 keeps the arc readable
          once the label is gone, which is the only information left at this size.

          `aria-hidden` on the ring itself here: the link already carries the full text,
          and a `progressbar` nested inside it would announce the same number twice.
        */}
        <span aria-hidden>
          <CreditRing
            value={available}
            max={allowance}
            label={valueText}
            valueText={valueText}
            gradientId="credit-arc-sidebar-collapsed"
            stroke={18}
            className="size-9"
          />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      data-slot="sidebar-credits"
      data-collapsed="false"
      className={cn(
        "group/credits flex items-center gap-3 rounded-xl p-2.5 transition-colors",
        // A tinted plate rather than a bordered card: the footer already has a top rule,
        // and a second box outline this close to it reads as a seam.
        "bg-brand/[0.07] hover:bg-brand/[0.12]",
        "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
      )}
    >
      <span aria-hidden>
        <CreditRing
          value={available}
          max={allowance}
          label={valueText}
          valueText={valueText}
          gradientId="credit-arc-sidebar"
          stroke={16}
          className="size-14"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold tabular-nums">
          {formatInteger(available)} credits
        </span>
        <span className="block truncate text-[11px] text-muted-foreground tabular-nums">
          {/* No percentage: the ring beside it already *is* the proportion, and printing
              the same fact twice in two notations makes the smaller one look like a
              second, different number. */}
          Renews {formatDate(credits.renewsAt, { day: "numeric", month: "short" })}
        </span>
        {/* The affordance, spelled out. A plate with a number on it is a readout; this
            line is what makes it a control. */}
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-brand-text">
          Buy more credits
          <ArrowRight
            aria-hidden
            className="size-3 transition-transform group-hover/credits:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
