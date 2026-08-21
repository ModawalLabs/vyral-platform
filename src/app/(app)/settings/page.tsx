import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { CreditsCard } from "@/components/settings/credits-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { getCredits, getProfile, listConnectedAccounts } from "@/data/account";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  /*
   * Fetched together rather than one await after another.
   *
   * The three are independent, so sequential awaits would stack their latency for no
   * reason once these are real network calls. They are instant today, which is exactly
   * why the shape has to be right now — a serial chain here is invisible until it is in
   * production.
   */
  const [profile, credits, accounts] = await Promise.all([
    getProfile(),
    getCredits(),
    listConnectedAccounts(),
  ]);

  return (
    <PageShell title="Settings" description="Your profile, credits and connections.">
      {/* `isolate` so the wash below can sit at `-z-10` without dropping behind the
          page background. */}
      <div className="relative isolate">
        {/*
          A brand wash behind the top of the panels, the same device the home page uses
          under its rails. Panels with translucent plates inside them need something to
          be translucent *over*, and on a bare page background they read as flat boxes.
          Anchored high and faded out well before the bottom, so it lights the cover art
          and the credit dial rather than tinting the whole page.
        */}
        <div
          aria-hidden
          data-slot="settings-wash"
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 bg-[radial-gradient(60%_58%_at_50%_0%,color-mix(in_oklab,var(--brand)_11%,transparent),color-mix(in_oklab,var(--brand)_4%,transparent)_45%,transparent_78%)]"
        />

        {/*
           Three columns, because the first row has two unequal jobs: the profile is
           artwork plus a field list and wants width, the credit dial is one figure and
           does not. A 2/1 split gives each what it needs and lines their bottom edges
           up. Below `lg` everything stacks in source order — profile, credits,
           connections — which is also the order of importance.
        */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ProfileCard profile={profile} />
          <CreditsCard credits={credits} />
          <ConnectedAccounts accounts={accounts} />
        </div>
      </div>
    </PageShell>
  );
}
