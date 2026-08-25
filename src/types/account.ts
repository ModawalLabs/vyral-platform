import { type SocialProvider } from "@/types/social";

/** One linked account on a platform. A platform can hold any number of these. */
export type LinkedAccount = {
  id: string;
  /** As the provider spells it, including the leading @. */
  handle: string;
  connectedAt: string;
};

/**
 * One publishing destination and every account linked to it.
 *
 * The union this replaced could only express "connected" or "not", which made a second
 * YouTube account unrepresentable. A list says both: empty is the offer, and any length
 * beyond that is what has been linked.
 *
 * **Order is priority.** `accounts[0]` is the default — the account a publish would go
 * to — rather than a `defaultAccountId` field beside the list. A separate field is a
 * second source of truth that can point at an account that has since been removed;
 * position cannot. Promoting an account is a move to the front, and removing the default
 * promotes the next one for free.
 */
export type ProviderConnection = {
  provider: SocialProvider;
  accounts: LinkedAccount[];
};

/** The signed-in user, as the settings page needs them. */
export type UserProfile = {
  name: string;
  email: string;
  /** E.164-ish, already formatted for display — no parsing happens in the UI. */
  phone: string;
  /** Absent until avatar upload exists, which is what puts the initials on screen. */
  avatarUrl?: string;
  initials: string;
  plan: string;
  memberSince: string;
};

/**
 * The workspace's generation budget.
 *
 * `available` and `allowance` rather than `used` and `total`: the balance is the
 * number people look for, and deriving it from a subtraction is how a meter ends up
 * disagreeing with the figure printed next to it.
 */
export type CreditBalance = {
  available: number;
  allowance: number;
  renewsAt: string;
  /** What one finished video costs at the workspace's current defaults. */
  creditsPerVideo: number;
};
