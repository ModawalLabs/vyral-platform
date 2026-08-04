import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  // Nothing to index yet, and a login page is not a landing page.
  robots: { index: false, follow: false },
};

/**
 * Login.
 *
 * Deliberately empty — the UI is being built from scratch. The `(auth)` layout
 * around it already centres this and renders the Vyral mark, so what goes here
 * is the form itself, nothing more.
 *
 * No auth provider is wired up. When one is chosen, its form drops in here and
 * the session gate goes in `src/proxy.ts`; `routes.signIn` and `authRoutes` in
 * `src/config/routes.ts` already point at this route.
 */
export default function SignInPage() {
  return null;
}
