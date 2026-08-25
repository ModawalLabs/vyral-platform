import { Sparkles } from "lucide-react";

import { CreditRing } from "@/components/credits/credit-ring";
import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { BrandLink } from "@/components/ui/brand-button";
import { routes } from "@/config/routes";
import { formatDate, formatInteger } from "@/lib/utils";
import type { CreditBalance } from "@/types/account";

/**
 * What is left to generate with.
 *
 * A ring rather than a bar. Both encode one proportion, but a bar is a strip of page
 * furniture while a ring is a dial — it can hold the number in its middle, so the
 * balance and the proportion become one object instead of a figure with a rule under
 * it. It is also the only round element on a page of rectangles, which is what makes
 * this panel read as the page's second focal point after the avatar.
 *
 * The ring itself is shared with the sidebar dial — see `CreditRing`.
 */
export function CreditsCard({ credits }: { credits: CreditBalance }) {
  const { available, allowance, creditsPerVideo } = credits;

  const used = Math.max(0, allowance - available);
  const videosLeft = Math.floor(available / creditsPerVideo);

  return (
    <Panel>
      <PanelBevel />

      {/* A bloom behind the ring, sized and placed to sit under it. This is what stops
          the dial looking like a chart pasted onto a white card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 size-64 -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_75%)] blur-xl"
      />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <PanelLabel>Credits</PanelLabel>

        <CreditRing
          value={available}
          max={allowance}
          label="Credits remaining this cycle"
          valueText={`${formatInteger(available)} of ${formatInteger(allowance)} credits remaining`}
          gradientId="credit-arc-settings"
          className="mx-auto size-40"
        >
          <span>
            <span className="block font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatInteger(available)}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground tabular-nums">
              of {formatInteger(allowance)}
            </span>
          </span>
        </CreditRing>

        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatInteger(used)} used · renews{" "}
            {formatDate(credits.renewsAt, { day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-muted-foreground">
            Roughly{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {videosLeft} videos
            </span>{" "}
            left at {creditsPerVideo} each.
          </p>
        </div>

        {/*
          A link, not a button, and aimed at the One Time tab specifically.

          Buying credits is a one-off top-up, not a change of plan, so landing on the
          annual tier cards would put the thing you asked for one click behind two things
          you did not. `plan` is read by the upgrade page and passed down as the switch's
          initial value — see `parseBillingPeriod`.

          `mt-auto` pins it to the bottom, so it lines up with the base of the taller
          profile panel beside it.
        */}
        <BrandLink
          href={{ pathname: routes.upgrade, query: { plan: "onetime" } }}
          className="mt-auto w-full justify-center"
        >
          <Sparkles aria-hidden className="size-4" />
          Buy credits
        </BrandLink>
      </div>
    </Panel>
  );
}
