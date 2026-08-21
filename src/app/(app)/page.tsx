import { ComposerHero } from "@/components/home/composer-hero";
import { ComposerProvider } from "@/components/home/composer-provider";
import { InspirationRail } from "@/components/home/inspiration-rail";
import { TrendingPrompts } from "@/components/home/trending-prompts";
import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <ComposerProvider>
      {/*
        56vh leaves the top of the Trending row visible on a laptop, so the rails read
        as part of the page rather than a hidden second screen. Capped at 34rem so a
        very tall window stops growing the hero instead of stranding the composer low
        in a mostly empty band.

        `justify-end` overrides the hero's own centring, and is what makes the space
        below the composer a constant. The leftover height between the content and 56vh
        has to go somewhere, and centring split it evenly above *and* below — which put
        the next section 97px under the composer on a tall window but only 32px under it
        on a short one, so the spacing shrank as the window did. Sending all the slack
        above the content leaves `pb-24` as the only thing beneath it, at every height.
        On a laptop the content still lands within a pixel of where centring put it.
      */}
      <ComposerHero className="min-h-[min(56vh,34rem)] justify-end pt-10 pb-24" />

      <div className="relative">
        {/*
          Frosted cards only look like glass over something. The hero's washes
          stop above this point, so the rails get their own — centred on the
          content column, wide, and stepped through a midpoint so the falloff
          is a smooth ramp rather than a visible ring.

          The upward reach has to stay *smaller than the hero's bottom padding*, or the
          wash climbs out of this section and tints the composer above it. At -top-32 it
          did: it reached 128px past the hero's edge, which was a 31px bleed onto the
          composer on a tall window and covered the whole control on a short one, reading
          as a tinted band with a visible edge drawn across the chat box. -top-16 against
          pb-24 keeps 32px of clearance at every viewport height.
        */}
        <div
          aria-hidden
          data-slot="rails-wash"
          className="pointer-events-none absolute inset-x-0 -top-16 h-[28rem] bg-[radial-gradient(58%_54%_at_50%_0%,color-mix(in_oklab,var(--brand)_12%,transparent),color-mix(in_oklab,var(--brand)_5%,transparent)_42%,transparent_76%)]"
        />

        <Container className="relative flex flex-col gap-14 pb-20">
          <TrendingPrompts />
          <InspirationRail />
        </Container>
      </div>
    </ComposerProvider>
  );
}
