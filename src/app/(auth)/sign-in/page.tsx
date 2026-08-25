import type { Metadata } from "next";

import { LoginVideo } from "@/components/auth/login-video";
import { SignInForm } from "@/components/auth/sign-in-form";
import { GlassWordmark } from "@/components/home/glass-wordmark";
import { HeroBackdrop } from "@/components/home/hero-backdrop";

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
        The brand washes. They stay rather than being dropped for the video, because the
        video is absent on a phone and under reduced motion — without them those cases
        would fall back to a flat ground, and the glass wordmark has nothing to refract on
        a flat ground.

        The video itself is not here any more. It is anchored to the frame below, since
        covering the viewport made the composition a function of the window's aspect
        ratio; `LoginVideo` carries the derivation.
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

          `68vh` tall and 42rem wide. Deliberately wider than the form column rather than
          matched to it — at the form's 28rem this frame was 1:1.8, narrow enough to read
          as a column of border rather than as a window.

          The container is wide enough to hold it outright — 42rem plus the 6rem gutter
          plus the form's 28rem is 76rem, and a narrower cap would have been squeezed
          with the `minmax` taking the shortfall back out of the frame.

          Hidden below `lg` — on a narrow screen it would push the form under the fold,
          and the form is the reason anyone is here.
        */}
        <div className="hidden justify-center lg:flex">
          {/*
            A geometry twin: the same box as the frame, but with no border of its own.

            That matters because the video is sized in percentages of this box. A
            percentage on an absolutely-positioned child resolves against its container's
            *padding* box, so putting the video inside the bordered element would have
            measured it against `width - 22px` and made the composition drift as the card
            resized. Borderless, padding box and border box are the same thing.

            The dark fill matches the video's own near-black backdrop, so on a window tall
            enough that the frame cannot cover the card there is no visible gap — see
            `LoginVideo` on why that band is left symmetrical.
          */}
          <div className="relative h-[68vh] w-full max-w-2xl bg-[#0a0d12]">
            <LoginVideo />

            <div
              aria-hidden
              data-slot="signin-plate"
              className={[
                "absolute inset-0 rounded-none border-[11px] border-white",
                /*
                  The dim outside the frame, as one enormous spread shadow.

                  A box-shadow paints outward from the border-box and never inside it, so
                  this darkens the whole viewport *except* what the frame encloses — which
                  is exactly the brief: the dancer reads at full strength inside the card
                  and her dress and particles carry on, dimmer, across the rest of the
                  page.

                  Done this way rather than with four scrim panels or a masked overlay
                  because the shadow is drawn by the frame itself: it cannot fall out of
                  register with the thing it is cutting a hole in, at any viewport size,
                  and it costs no extra element. `100vmax` guarantees it reaches the far
                  corner of any window.

                  This overlay comes after the video in the DOM and both are positioned,
                  so the shadow paints over it; the form is lifted to `z-10` and stays
                  above both.
                */
                "shadow-[0_0_0_100vmax_color-mix(in_oklab,#08080b_78%,transparent)]",
              ].join(" ")}
            />

            {/*
              The tagline, in the frame's bottom-left corner.

              `inset-[11px]` makes this box exactly the frame's *inner* area — the 11px is
              the white border's width, and the two have to stay in step or the padding
              below would be measured from the wrong edge. Inset that way, `pl-6` and
              `pb-22` are a true 24px and 88px in from the visible corner rather than from
              somewhere under the border.

              After the plate in the DOM so it paints over both the video and the frame,
              and `pointer-events-none` because it is a caption sitting on top of a
              decorative panel — it should never intercept a click meant for the page.
            */}
            <div className="pointer-events-none absolute inset-[11px] flex items-end">
              <p
                data-slot="signin-tagline"
                className={[
                  "pb-22 pl-6 text-2xl leading-tight font-normal tracking-tight text-white",
                  // The video underneath is dark here — this is the floor of the shot —
                  // but it is *moving*, so a tight shadow keeps the glyph edges hard
                  // against whatever drifts behind them. Deliberately small and opaque
                  // rather than a soft glow: a blur would round the very edges this is
                  // meant to sharpen.
                  "[text-shadow:0_1px_3px_rgb(0_0_0/0.75)]",
                  // Greyscale antialiasing. On dark backgrounds subpixel rendering fringes
                  // light type with colour, which is exactly what reads as "soft" here.
                  "antialiased",
                ].join(" ")}
              >
                {/*
                  Two block spans rather than a `<br>`: the break is a design decision
                  that has to hold, and blocks give each line its own box so the leading
                  applies evenly. It also means no text-wrapping utility is left fighting
                  a break it cannot see.
                */}
                <span className="block">Write a prompt.</span>
                <span className="block">Get a Video. Go Viral</span>
              </p>
            </div>
          </div>
        </div>

        {/* No `mx-auto`: the track is now exactly the column's width, so centring in it
            was a no-op that would quietly re-introduce an offset if the track ever grew.

            `relative z-10` lifts the whole column above the frame's spread shadow.
            Without it the scrim — painted as part of a sibling's background — would sit
            over the form's own backgrounds and mute the provider buttons. */}
        <div className="relative z-10 w-full max-w-md">
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
        </div>
      </div>
    </div>
  );
}
