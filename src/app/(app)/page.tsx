import { ComposerHero } from "@/components/home/composer-hero";
import { ComposerProvider } from "@/components/home/composer-provider";
import { InspirationRail } from "@/components/home/inspiration-rail";
import { TrendingPrompts } from "@/components/home/trending-prompts";
import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <ComposerProvider>
      {/* 56vh leaves the top of the Trending row visible on a laptop, so the
          rails read as part of the page rather than a hidden second screen. */}
      <ComposerHero className="min-h-[56vh] pt-10 pb-8" />

      <div className="relative">
        {/*
          Frosted cards only look like glass over something. The hero's washes
          stop above this point, so the rails get their own — centred on the
          content column, wide, and stepped through a midpoint so the falloff
          is a smooth ramp rather than a visible ring.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-[32rem] bg-[radial-gradient(58%_54%_at_50%_0%,color-mix(in_oklab,var(--brand)_12%,transparent),color-mix(in_oklab,var(--brand)_5%,transparent)_42%,transparent_76%)]"
        />

        <Container className="relative flex flex-col gap-14 pb-20">
          <TrendingPrompts />
          <InspirationRail />
        </Container>
      </div>
    </ComposerProvider>
  );
}
