/**
 * Placeholder identity.
 *
 * TODO: replace with the signed-in user once auth lands. Kept in one module so that
 * swap is a single edit rather than a search across every greeting.
 *
 * The whole identity lives here, not just the first name: the home greeting and the
 * settings profile both read from it, and two placeholders would eventually disagree
 * about who is signed in. Everything billing-shaped stays out — that belongs to
 * `src/data/account.ts`, which is what a real API would answer.
 */
export const CURRENT_USER = {
  firstName: "Shivansh",
  lastName: "Modawal",
  email: "shivansh@i2ltech.com",
  /** Pre-formatted for display; nothing in the UI parses it. */
  phone: "+91 98765 43210",
  memberSince: "2026-03-14T09:00:00.000Z",
};

/** Full name, derived so it cannot drift from the parts it is built from. */
export const userFullName = `${CURRENT_USER.firstName} ${CURRENT_USER.lastName}`;

/**
 * Initials for the avatar fallback.
 *
 * Derived rather than stored for the same reason as the name — a hand-written "SM"
 * would survive a rename of either half and quietly be wrong.
 */
export const userInitials = `${CURRENT_USER.firstName[0]}${CURRENT_USER.lastName[0]}`;
