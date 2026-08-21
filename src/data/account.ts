import "server-only";

import { CURRENT_USER, userFullName, userInitials } from "@/config/current-user";
import type { ConnectedAccount, CreditBalance, UserProfile } from "@/types/account";

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

export async function getCredits(): Promise<CreditBalance> {
  // TODO: from the billing provider once it is wired up.
  return {
    available: 1_240,
    allowance: 2_000,
    renewsAt: "2026-09-01T00:00:00.000Z",
    creditsPerVideo: 100,
  };
}

/**
 * Every provider the workspace can publish to, linked or not.
 *
 * Returns all three rather than only the linked ones: the page has to render the
 * unlinked ones as an offer, so filtering here would just push a second list of
 * "everything else" back into the component.
 */
export async function listConnectedAccounts(): Promise<ConnectedAccount[]> {
  // TODO: from the OAuth provider once it is wired up.
  return [
    {
      provider: "youtube",
      connected: true,
      handle: "@shivansh",
      connectedAt: "2026-06-02T11:30:00.000Z",
    },
    { provider: "instagram", connected: false },
    { provider: "tiktok", connected: false },
  ];
}
