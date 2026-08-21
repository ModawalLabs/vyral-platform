import { type SocialProvider } from "@/types/social";

/**
 * One publishing destination and whether it is linked.
 *
 * `handle` and `connectedAt` travel together — both present or both absent — which
 * is what `connected` narrows on, so a row can never render a handle for an account
 * that is not linked.
 */
export type ConnectedAccount =
  | { provider: SocialProvider; connected: false }
  | {
      provider: SocialProvider;
      connected: true;
      /** As the provider spells it, including the leading @. */
      handle: string;
      connectedAt: string;
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
