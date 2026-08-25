import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PricingPlans } from "@/components/upgrade/pricing-plans";
import { getProfile } from "@/data/account";
import { listCreditPacks, listPlans } from "@/data/pricing";
import { parseBillingPeriod } from "@/types/pricing";

export const metadata: Metadata = {
  title: "Upgrade",
  description:
    "Monthly, annual and one-time credit plans — from solo creators to full studios.",
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  /*
   * Fetched together rather than one await after another.
   *
   * The three are independent, so sequential awaits would stack their latency for no
   * reason once these are real network calls. They are instant today, which is exactly
   * why the shape has to be right now — a serial chain here is invisible until it is in
   * production.
   */
  const [plans, packs, profile, { plan }] = await Promise.all([
    listPlans(),
    listCreditPacks(),
    getProfile(),
    searchParams,
  ]);

  return (
    /*
      Centred, not `PageShell`.

      Every other workspace page is a left-aligned heading over a list, because it is
      answering "what do I have". This one is a choice between three things, so it reads
      as a spread: the heading sits over the middle card and the eye starts in the centre
      rather than at the left margin.

      `flex-1` with `justify-center` on a column that `main` already stretches gives the
      vertical centring for free, and degrades to nothing when the cards are taller than
      the viewport — the page just scrolls as normal instead of clipping.
    */
    <Container className="flex flex-1 flex-col justify-center py-12">
      {/* `isolate` so the wash below can sit at `-z-10` without dropping behind the
          page background. */}
      <div className="relative isolate">
        {/* The same brand wash the other workspace pages sit on, so the gradient-framed
            cards have something to be lit by rather than floating on a bare page.
            Centred on the heading here rather than the page's top edge, since the block
            it lights is now vertically centred too. */}
        <div
          aria-hidden
          data-slot="upgrade-wash"
          className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-96 bg-[radial-gradient(60%_58%_at_50%_0%,color-mix(in_oklab,var(--brand)_11%,transparent),color-mix(in_oklab,var(--brand)_4%,transparent)_45%,transparent_78%)]"
        />

        <header className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Upgrade
          </h1>
          {/* The landing site's subtitle, trimmed of the line break it carried there. */}
          <p className="mt-3 text-pretty text-muted-foreground">
            Flexible credits and seats whether you&apos;re solo, growing fast, or scaling
            a full creative team — upgrade or pause anytime.
          </p>
        </header>

        <PricingPlans
          plans={plans}
          packs={packs}
          currentPlan={profile.plan}
          initialPeriod={parseBillingPeriod(plan)}
        />
      </div>
    </Container>
  );
}
