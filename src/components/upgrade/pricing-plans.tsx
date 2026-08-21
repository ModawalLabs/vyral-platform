"use client";

import { useState } from "react";

import { PlanCard } from "@/components/upgrade/plan-card";
import { PACK_VISUALS } from "@/components/upgrade/plan-visuals";
import {
  BILLING_PERIODS,
  type BillingPeriod,
  type CreditPack,
  type Plan,
} from "@/types/pricing";
import { cn } from "@/lib/utils";

/**
 * The pricing section: billing switch, then either the three tiers or the credit packs.
 *
 * Ported from the landing site's `Plans`. Two things deliberately did not come with it:
 *
 * - The `Reveal` scroll animation. It exists to stage a long marketing page as you
 *   scroll; here the cards are above the fold on load, so it would only delay them.
 * - The centred display heading. The page heading is the workspace's, so this component
 *   starts at the switch.
 *
 * Annual is the default, as on the landing site — it is the plan to land on, and it is
 * the only view that shows the "Most popular" badge.
 */
export function PricingPlans({
  plans,
  packs,
  currentPlan,
}: {
  plans: Plan[];
  packs: CreditPack[];
  /** The plan name from the account, e.g. `Studio`. Matched loosely — see below. */
  currentPlan: string;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const onetime = period === "onetime";

  return (
    <div className="flex flex-col gap-12">
      {/*
        `role="group"` with `aria-pressed`, not a radiogroup: the landing site made the
        same call, and a radiogroup would owe arrow-key navigation that these three
        buttons do not implement.
      */}
      <div
        role="group"
        aria-label="Billing period"
        data-slot="billing-switch"
        className="mx-auto inline-flex items-center gap-1 rounded-full bg-foreground/[0.04] p-1 ring-1 ring-foreground/10 ring-inset"
      >
        {BILLING_PERIODS.map((option) => {
          const active = option.id === period;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPeriod(option.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
                active
                  ? "bg-brand text-brand-foreground shadow-sm shadow-brand/25"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              {option.label}
              {"note" in option && option.note ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                    active
                      ? "bg-brand-foreground/20 text-brand-foreground"
                      : "bg-foreground/[0.08] text-muted-foreground",
                  )}
                >
                  {option.note}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {onetime ? (
        /*
          Credit packs carry no seats, no feature list and nothing recurring to explain,
          so the card is only icon, name, price, credits.

          `flex-wrap` with `justify-center` rather than a 4-column grid, which is what
          centres the short second row — a grid would leave an orphan gap on the right.
          Carried over from the landing site along with the width fractions.
        */
        <div
          data-slot="credit-packs"
          className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4"
        >
          {packs.map((pack) => {
            const { Icon, frame, accent } = PACK_VISUALS[pack.id];

            return (
              <div
                key={pack.id}
                data-slot="credit-pack"
                className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
              >
                {/* 2px frame here rather than the plans' 3px, with the inner radius
                    stepped to match — at this smaller size a 3px bed reads as a border
                    instead of a frame. */}
                <div className={cn("h-full rounded-2xl bg-gradient-to-b p-[2px]", frame)}>
                  <div className="h-full rounded-[calc(var(--radius-2xl)-2px)] bg-card px-5 py-6 text-center">
                    <Icon aria-hidden className={cn("mx-auto size-6", accent)} />

                    <h3 className="mt-3 text-sm font-semibold tracking-tight">
                      {pack.name}
                    </h3>

                    <p
                      className={cn(
                        "mt-4 font-heading text-3xl leading-none font-bold tabular-nums",
                        accent,
                      )}
                    >
                      ${pack.price}
                    </p>

                    {/* A pill rather than a plain grey line: it gives the credits their
                        own object so they read as the thing being bought, without
                        out-shouting the price. */}
                    <span className="mt-3 inline-flex items-baseline gap-1 rounded-full bg-foreground/[0.05] px-3 py-1 ring-1 ring-foreground/10 ring-inset">
                      <span className="text-sm font-semibold tabular-nums">
                        {pack.credits}
                      </span>
                      <span className="text-[11px] text-muted-foreground">credits</span>
                    </span>

                    {/* TODO: opens checkout once billing is wired up. A real button, not
                        the landing site's link — there is no `#cta` section to jump to
                        inside the app. */}
                    <button
                      type="button"
                      title={`Buying the ${pack.name} pack is not wired up yet`}
                      className="mt-4 h-8 w-full rounded-full text-xs font-semibold text-brand-text ring-1 ring-brand/40 transition-colors ring-inset hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                      Buy pack
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          data-slot="plan-cards"
          className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.tone}
              plan={plan}
              period={period}
              // The account stores the tier as `Studio`, the card is named
              // `Studio Plan` — matched on the prefix rather than adding a second id to
              // keep in sync between the billing data and the profile.
              isCurrent={plan.name.startsWith(currentPlan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
