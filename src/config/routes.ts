/**
 * Centralized route table. Keeping paths here (rather than as string literals
 * scattered through components) means a URL change is a one-line edit and
 * `typedRoutes` can verify every `<Link href>` against it.
 */
export const routes = {
  home: "/",
  /** Full-screen composer. Outside the `(app)` group, so it has no sidebar. */
  newVideo: "/new",
  projects: "/projects",
  templates: "/templates",
  settings: "/settings",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

export type Route = (typeof routes)[keyof typeof routes];

/**
 * Prefixes that require an authenticated session (enforced in `src/proxy.ts`).
 * The whole workspace is behind auth, so this is everything except the auth
 * routes themselves — listed explicitly rather than inverted so adding a public
 * page is an addition, not a subtraction.
 */
export const protectedPrefixes = [
  routes.home,
  routes.newVideo,
  routes.projects,
  routes.templates,
  routes.settings,
] as const;

/** Routes an authenticated user should be bounced away from. */
export const authRoutes = [routes.signIn, routes.signUp] as const;

export const DEFAULT_REDIRECT_AFTER_SIGN_IN = routes.home;
