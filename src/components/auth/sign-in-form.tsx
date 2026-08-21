"use client";

import { FacebookMark, GoogleMark } from "@/components/auth/oauth-marks";
import { cn } from "@/lib/utils";

/** One treatment for both fields, so the pair reads as one control. */
const FIELD = cn(
  "h-11 w-full rounded-xl bg-white/[0.04] px-3.5 text-sm text-foreground",
  "ring-1 ring-white/12 transition-colors ring-inset",
  "placeholder:text-muted-foreground/60",
  "focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:outline-none",
);

const LABEL =
  "block text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase";

/** Both providers get the same geometry; only the surface differs. */
const PROVIDER = cn(
  "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold",
  "transition-[filter,background-color] focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:outline-none",
);

/**
 * The three ways in.
 *
 * Social first, on one row, then a rule, then the form. That order is the one people
 * have learned from everything else they sign into — and it puts the two one-click
 * routes above the one that costs typing.
 *
 * Nothing authenticates. There is no provider wired up, so every control says so on
 * hover rather than pretending. A client component only for the submit guard: without
 * it, Enter in either field would navigate to `?email=…&password=…`, putting a password
 * in the URL bar and the history.
 *
 * TODO: swap each handler for the chosen provider's call, and put the session gate in
 * `src/proxy.ts` — `protectedPrefixes` there already covers the whole workspace.
 */
export function SignInForm() {
  return (
    <div className="flex flex-col gap-5">
      {/*
        Side by side, each taking half the column.

        The labels drop to just the provider name at this width. "Continue with Google"
        needs about 173px of its own, which two of them cannot have in a 448px column
        once the gap is taken out — and a label that truncates or wraps to two lines on a
        sign-in button is worse than one that says the only word that matters. The
        `aria-label` keeps the full phrase for anyone who cannot see the mark beside it.
      */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          aria-label="Continue with Google"
          title="Google sign-in is not wired up yet"
          className={cn(PROVIDER, "bg-white text-[#1f1f1f] hover:brightness-95")}
        >
          <GoogleMark className="size-[18px]" />
          Google
        </button>

        <button
          type="button"
          aria-label="Continue with Facebook"
          title="Facebook sign-in is not wired up yet"
          className={cn(PROVIDER, "bg-[#1877F2] text-white hover:brightness-110")}
        >
          <FacebookMark className="size-[18px]" />
          Facebook
        </button>
      </div>

      {/* A rule with the word sitting in it, drawn as two flex-1 lines rather than one
          line with a masked centre — no background colour to match, so it survives
          whatever is painted behind this column. */}
      <div aria-hidden className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/12" />
        <span className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-white/12" />
      </div>

      <form
        // Real form semantics, no navigation: see the note above.
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="signin-email" className={LABEL}>
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            className={cn(FIELD, "mt-2")}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="signin-password" className={LABEL}>
              Password
            </label>
            {/* A button, not a link: there is no reset route to point at yet, and a
                dead `href` is worse than a control that admits it does nothing. */}
            <button
              type="button"
              title="Password reset is not wired up yet"
              className="rounded text-[11px] font-medium text-brand-text transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn(FIELD, "mt-2")}
          />
        </div>

        {/* "Continue with email" rather than "Sign in": it sits under the two provider
            buttons and now reads as the third option in the same set, which is what the
            column actually is. */}
        <button
          type="submit"
          title="Email sign-in is not wired up yet"
          className={cn(
            PROVIDER,
            "mt-1 bg-gradient-to-r from-brand to-brand-accent text-brand-foreground",
            "shadow-lg shadow-brand/25 hover:brightness-110",
          )}
        >
          Continue with email
        </button>
      </form>
    </div>
  );
}
