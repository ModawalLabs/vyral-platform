import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { GlassWordmark } from "@/components/home/glass-wordmark";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Sign in",
  // Nothing to index yet, and a login page is not a landing page.
  robots: { index: false, follow: false },
};

/**
 * Login.
 *
 * Dark whatever the app's theme is. The frame's white mat and the glass wordmark are
 * both built for a dark ground, and an auth screen sits outside the workspace shell
 * anyway — so rather than let the composition depend on a setting, this page carries
 * its own. `dark` on the wrapper rather than hardcoded colours: the class re-points
 * every token underneath it, so `bg-background`, the glass variables and the brand ramp
 * all resolve to their dark values and nothing here has to restate a palette.
 *
 * No auth provider is wired up. Every control says so on hover; `SignInForm` carries
 * the detail.
 */
export default function SignInPage() {
  return (
    // `isolate` because `HeroBackdrop` paints at a negative z-index and would otherwise
    // fall behind the page background and vanish.
    <div className="dark relative isolate flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-background px-6 py-14 text-foreground">
      {/*
        Brand washes only — the doodle field is off.

        The washes stay because they are what the glass wordmark refracts, and because
        they are what shows through the empty frame on the left. On a flat ground both
        would read as grey.

        TODO: this is where the background video goes. It belongs behind everything at
        the same negative z-index the washes use, with the washes left on top of it as a
        colour grade.
      */}
      <HeroBackdrop doodles={false} />

      {/*
        Explicit track widths rather than `grid-cols-2`, because the two halves are no
        longer the same measure: the frame wants width, the form is sized by its fields
        and gains nothing from more. Equal columns would have capped the frame at half
        the container.

        `minmax(0, …)` on both so they shrink together on a narrower window instead of
        overflowing.

        `justify-start`, so both halves sit against the left gutter and the leftover
        width falls on the right. Centring held the frame ~90px off the left edge;
        `justify-between` fixed that but paid for it by flinging the form to the opposite
        gutter and stretching the channel to 272px at this width. Packed to the start,
        the gap is the only thing between them, so moving one left moves the other with
        it.

        The gap is therefore what sets the channel outright — 8rem, a little more than
        the 6rem it was asked to be, because with the two halves packed together the gap
        is now the whole separation rather than a floor under a distributed one.

        Still capped at 96rem: past that the pair would keep drifting right of the
        viewport's centre as the window grows, since the outer flex centres this
        container.

        `items-center` so the frame and the column beside it share a centre line.
      */}
      <div className="grid w-full max-w-[96rem] items-center justify-start gap-12 lg:grid-cols-[minmax(0,42rem)_minmax(0,28rem)] lg:gap-32">
        {/*
          An empty frame — a window onto the page background rather than a card.

          No background and nothing inside it, so the washes behind the page show
          through. `border`, not padding plus a fill, because a border cannot be rounded
          away by a radius set further up, and `rounded-none` states the square corners
          rather than trusting that nothing else set one.

          `85vh` tall and 42rem wide. Deliberately wider than the form column rather than
          matched to it — at the form's 28rem this frame was 1:1.8, narrow enough to read
          as a column of border rather than as a window.

          The container is wide enough to hold it outright — 42rem plus the 6rem gutter
          plus the form's 28rem is 76rem, and a narrower cap would have been squeezed
          with the `minmax` taking the shortfall back out of the frame.

          Hidden below `lg` — on a narrow screen it would push the form under the fold,
          and the form is the reason anyone is here.
        */}
        <div className="hidden justify-center lg:flex">
          <div
            aria-hidden
            data-slot="signin-plate"
            className="h-[85vh] w-full max-w-2xl rounded-none border-[11px] border-white"
          />
        </div>

        {/* No `mx-auto`: the track is now exactly the column's width, so centring in it
            was a no-op that would quietly re-introduce an offset if the track ever grew. */}
        <div className="w-full max-w-md">
          {/* Centred as a block, over the controls below it. The wordmark is the page's
              heading, so it is the `h1` — a separate visually hidden title would leave
              two headings competing for the same job. */}
          <div className="text-center">
            <h1 className="text-[clamp(3rem,7vw,4.5rem)] leading-[0.95] font-bold tracking-tight">
              <GlassWordmark>Vyral</GlassWordmark>
            </h1>

            <p className="mt-6 text-2xl font-semibold tracking-tight">Welcome back</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pick up where you left off, or start something new.
            </p>
          </div>

          <div className="mt-8">
            <SignInForm />
          </div>

          {/* A real link to a real route, unlike everything above it. */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={routes.signUp}
              className="rounded font-medium text-brand-text transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
