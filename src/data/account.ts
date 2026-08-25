import "server-only";

import { CURRENT_USER, userFullName, userInitials } from "@/config/current-user";
import { getSpendCycle, spentThisCycle } from "@/data/spending";
import type { CreditBalance, ProviderConnection, UserProfile } from "@/types/account";

/**
 * Account data access.
 *
 * The only file that needs to change when the API lands: keep these signatures and
 * replace the bodies with `fetch`/database calls. Every consumer already awaits them,
 * so no component or page is touched.
 *
 * `server-only` makes that swap safe — importing this from a client component fails
 * the build rather than shipping the mock (or, later, an access token) to the browser.
 * That matters more here than for projects: connected-account rows are one field away
 * from holding OAuth credentials.
 *
 * The profile is composed from `CURRENT_USER` rather than restated, so the settings
 * page and the home greeting cannot disagree about who is signed in.
 */

export async function getProfile(): Promise<UserProfile> {
  return {
    name: userFullName,
    email: CURRENT_USER.email,
    phone: CURRENT_USER.phone,
    // No `avatarUrl`: there is no upload yet, so the initials fallback is the honest
    // state rather than stock art standing in for someone's face.
    initials: userInitials,
    plan: "Studio",
    memberSince: CURRENT_USER.memberSince,
  };
}

/**
 * The balance, derived from the ledger rather than stated.
 *
 * `available` used to be a literal here and the spending panel a separate mock, which
 * is two sources of truth for one number — the ring would have gone on saying 1,240
 * however the charts below it added up. Subtracting the ledger from the allowance makes
 * that disagreement unrepresentable.
 */
export async function getCredits(): Promise<CreditBalance> {
  // TODO: both come from the billing provider once it is wired up.
  const [cycle, spent] = await Promise.all([getSpendCycle(), spentThisCycle()]);

  return {
    available: cycle.allowance - spent,
    allowance: cycle.allowance,
    renewsAt: cycle.renewsAt,
    creditsPerVideo: 100,
  };
}

/**
 * Every provider the workspace can publish to, with whatever is linked to it.
 *
 * Returns all three rather than only the linked ones: the page has to render the
 * unlinked ones as an offer, so filtering here would just push a second list of
 * "everything else" back into the component.
 *
 * Seeded to show all three states at once — two accounts, one account, none — so the
 * multi-account case is visible without having to click anything first.
 */
export async function listProviderConnections(): Promise<ProviderConnection[]> {
  // TODO: from the OAuth provider once it is wired up.
  return [
    {
      provider: "youtube",
      accounts: [
        {
          id: "yt_1",
          handle: "@shivansh",
          connectedAt: "2026-06-02T11:30:00.000Z",
        },
        {
          id: "yt_2",
          handle: "@vyral.studio",
          connectedAt: "2026-07-18T09:05:00.000Z",
        },
      ],
    },
    {
      provider: "instagram",
      accounts: [
        { id: "ig_1", handle: "@vyral", connectedAt: "2026-08-04T16:40:00.000Z" },
      ],
    },
    { provider: "tiktok", accounts: [] },
  ];
}
