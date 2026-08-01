/**
 * Centralized route table. Keeping paths here (rather than as string literals
 * scattered through components) means a URL change is a one-line edit and
 * `typedRoutes` can verify every `<Link href>` against it.
 */
export const routes = {
  home: "/",
  pricing: "/pricing",
  dashboard: "/dashboard",
  settings: "/dashboard/settings",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

export type Route = (typeof routes)[keyof typeof routes];

/** Prefixes that require an authenticated session (enforced in middleware). */
export const protectedPrefixes = ["/dashboard"] as const;

/** Routes an authenticated user should be bounced away from. */
export const authRoutes = [routes.signIn, routes.signUp] as const;

export const DEFAULT_REDIRECT_AFTER_SIGN_IN = routes.dashboard;
