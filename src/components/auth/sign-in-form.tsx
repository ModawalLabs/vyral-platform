"use client";

import { useRouter } from "next/navigation";

import { FacebookMark, GoogleMark } from "@/components/auth/oauth-marks";
import { GLASS_SURFACE } from "@/components/create/glass";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

/** The email field’s surface. Kept as a constant so it stays in step with the provider
 * buttons above it — same height, same radius, same focus ring. */
const FIELD = cn(
  "h-11 w-full rounded-xl bg-white/[0.04] px-3.5 text-sm text-foreground",
  "ring-1 ring-white/12 transition-colors ring-inset",
  "placeholder:text-muted-foreground/60",
  "focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:outline-none",
);

const LABEL =
  "block text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase";

/**
 * Geometry and behaviour shared by all three ways in.
 *
 * The lift is the hover: a single pixel up, with a shadow under it, so the button reads
 * as coming off the page rather than merely changing colour. One pixel because these sit
 * in a tight column — anything more and the row visibly reflows as the pointer crosses
 * it. `active:translate-y-0` settles it back on press, which is what makes the lift feel
 * like a button rather than an animation.
 *
 * The transition names every property the three of them animate between: the glass pair
 * move their plate and border, the brand button moves its filter, and all three move.
 */
const PROVIDER = cn(
  "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold",
  "transition-[filter,background-color,border-color,transform,box-shadow] duration-200",
  "hover:-translate-y-px active:translate-y-0",
  "focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:outline-none",
);

/**
 * The surface both OAuth buttons share.
 *
 * Facebook was on its own brand blue, which made the pair read as one recommended route
 * and one alternative rather than as two equal options. On one surface the marks are the
 * only difference between them, which is the whole point of the row.
 *
 * That surface is the app's own glass — `GLASS_SURFACE`, the same plate the composer and
 * the session bar use — rather than a second frosted look invented here. It earns its
 * place on this page in a way it would not on a plain form: there is a video playing
 * behind these buttons, and glass is the only treatment that lets it through instead of
 * stamping two solid white slabs over it.
 *
 * `border` for the width, because the shared class only sets the border *colour*.
 *
 * The hover raises the plate itself — 6% to 14% white, with the border going 14% to 30%.
 * `GLASS_SURFACE` deliberately pins its own hover so a caller's tint cannot swap the
 * glass out for a flat fill; these override that pair rather than removing it, so the
 * plate stays glass and simply gets denser. A brightness bump alone was too quiet to
 * register over a moving video.
 */
const PROVIDER_GLASS = cn(
  GLASS_SURFACE,
  "border text-foreground",
  "hover:border-white/30 hover:bg-white/[0.14] hover:shadow-lg hover:shadow-black/40",
);

/**
 * The three ways in.
 *
 * Social first, on one row, then a rule, then the form. That order is the one people
 * have learned from everything else they sign into — and it puts the two one-click
 * routes above the one that costs typing.
 *
 * Nothing authenticates. All three routes go straight to onboarding, which is what
 * makes the flow walkable end to end — the point of this build is to feel the sequence,
 * not to verify anyone. Every control still says as much on hover, so it is clear the
 * provider is not really being called.
 *
 * Email only, no password: with nothing to authenticate against, a password field asked
 * for a secret it had no use for and could not check.
 *
 * The submit guard matters even so: without `preventDefault` the form would navigate to
 * `?email=…` on Enter, putting the address in the URL bar and the history before the
 * push ever ran.
 *
 * TODO: swap each handler for the chosen provider's call, send new accounts to
 * onboarding and returning ones to the workspace, and put the session gate in
 * `src/proxy.ts` — `protectedPrefixes` there already covers both.
 */
export function SignInForm() {
  const router = useRouter();
  // One destination for all three: see the note above.
  const enter = () => router.push(routes.onboarding);

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
          onClick={enter}
          aria-label="Continue with Google"
          title="Google sign-in is not wired up yet — continues to setup"
          className={cn(PROVIDER, PROVIDER_GLASS)}
        >
          <GoogleMark className="size-[18px]" />
          Google
        </button>

        <button
          type="button"
          onClick={enter}
          aria-label="Continue with Facebook"
          title="Facebook sign-in is not wired up yet — continues to setup"
          className={cn(PROVIDER, PROVIDER_GLASS)}
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

        {/* "Continue with email" rather than "Sign in": it sits under the two provider
            buttons and now reads as the third option in the same set, which is what the
            column actually is. */}
        <button
          type="submit"
          onClick={enter}
          title="Email sign-in is not wired up yet — continues to setup"
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
