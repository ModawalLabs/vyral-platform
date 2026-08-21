import { Check } from "lucide-react";

import { PLAN_VISUALS } from "@/components/upgrade/plan-visuals";
import { PLAN_FEATURES, PLAN_SUBTITLE, type Plan } from "@/types/pricing";
import { cn } from "@/lib/utils";

/**
 * One subscription tier.
 *
 * A port of the landing site's `PricingCardTriple`, re-skinned. Same anatomy — gradient
 * frame, icon, name, subtitle, big price, ticked feature list, pill CTA — but every
 * surface and every piece of body text now comes from the app's tokens instead of
 * hardcoded `zinc-900` and `white/10`. That is the whole difference: the landing site is
 * dark-only, and those values turn the card into a dark slab on this app's light page.
 *
 * The frame is a 3px gradient bed with the card sitting inside it, so the inner radius
 * is the outer minus 3 or the corners show a bright wedge.
 */
export function PlanCard({
  plan,
  period,
  isCurrent,
}: {
  plan: Plan;
  period: "monthly" | "annual";
  /** The tier this account is already on. Replaces the CTA and rings the card. */
  isCurrent: boolean;
}) {
  const { Icon, frame, accent, badge } = PLAN_VISUALS[plan.tone];

  return (
    <section
      aria-label={`${plan.name}${isCurrent ? ", current plan" : ""}`}
      data-slot="plan-card"
      data-current={isCurrent ? "" : undefined}
      className="relative"
    >
      {/* Badges sit on the wrapper rather than inside the card, so the card body needs
          no top padding reserved for something that is usually absent. */}
      {isCurrent ? (
        <span
          data-slot="current-badge"
          className={cn(
            "absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase",
            /*
              Opaque, and only the *text* takes the tier colour.

              It used to compose `bg-background` with `badge`, which carries its own
              `bg-<tier>/12`. tailwind-merge keeps the last background of a group, so the
              tint won and the pill ended up 12% opaque — the card's gradient frame ran
              straight through it, which is the line that looked like a bug. A pill
              straddling an edge has to be able to cover it.
            */
            "bg-card ring-1 ring-foreground/15 ring-inset",
            /*
              A halo in the card's own colour, so the 3px gradient frame terminates a
              few pixels clear of the pill instead of butting straight into its ring at
              the exact height of the text. Same colour as the pill's own fill, so the
              spread reads as one continuous chip rather than a second outline.
            */
            "shadow-[0_0_0_4px_var(--card)]",
            accent,
          )}
        >
          Current plan
        </span>
      ) : plan.popular && period === "annual" ? (
        // Annual only, exactly as on the landing site — the badge is there to push the
        // annual view, so it has nothing to say on the monthly one.
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f472b6] to-[#c026d3] px-3 py-1 text-[11px] font-semibold tracking-wider whitespace-nowrap text-white uppercase shadow-lg shadow-black/20">
          Most popular
        </span>
      ) : null}

      <div className={cn("rounded-3xl bg-gradient-to-b p-[3px]", frame)}>
        <div
          className={cn(
            "h-full rounded-[calc(var(--radius-3xl)-3px)] bg-card px-8 pt-10 pb-8",
            // The current tier gets an inner ring as well as its badge: on a page of
            // three near-identical cards, a badge alone is easy to miss.
            isCurrent && "ring-2 ring-brand/30 ring-inset",
          )}
        >
          <div aria-hidden className={cn("mb-3 grid place-items-center", accent)}>
            <Icon className="size-10" strokeWidth={1.5} />
          </div>

          <h3 className="text-center font-heading text-xl font-semibold tracking-tight">
            {plan.name}
          </h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {PLAN_SUBTITLE}
          </p>

          <p className={cn("mt-6 text-center", accent)}>
            <span className="font-heading text-5xl leading-none font-bold tabular-nums">
              ${plan.price[period]}
            </span>
            {/* Both periods read "/month" on the landing site — the annual price is the
                monthly equivalent, not the yearly total. Kept, so the two pages quote
                the same number the same way. */}
            <span className="ml-1 text-muted-foreground">/month</span>
          </p>

          <ul className="mt-8 space-y-4">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                    badge,
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm text-foreground/85">{feature}</span>
              </li>
            ))}
          </ul>

          {/* TODO: opens checkout once billing is wired up. Disabled on the current
              tier because there is genuinely nothing to buy there — unlike the others,
              which are only inert for want of a backend. */}
          <button
            type="button"
            disabled={isCurrent}
            title={
              isCurrent
                ? "You are on this plan"
                : `Choosing ${plan.name} is not wired up yet`
            }
            className={cn(
              "mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
              isCurrent
                ? "bg-foreground/[0.06] text-muted-foreground"
                : "bg-gradient-to-r from-brand to-brand-accent text-brand-foreground shadow-lg shadow-brand/25 hover:brightness-110",
              "disabled:pointer-events-none",
            )}
          >
            {isCurrent ? "Current plan" : "Choose Plan"}
          </button>
        </div>
      </div>
    </section>
  );
}
