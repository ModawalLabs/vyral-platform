import type { Metadata } from "next";

import { GlassWordmark } from "@/components/home/glass-wordmark";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Get set up",
  robots: { index: false, follow: false },
};

/**
 * First run.
 *
 * Dark whatever the app's theme is, for the same reason the sign-in screen is: the glass
 * wordmark and the frosted pills are both built for a dark ground, and this screen sits
 * outside the workspace shell so it owes it nothing. `dark` on the wrapper re-points
 * every token underneath it rather than restating a palette here.
 *
 * Nothing is persisted — see `OnboardingFlow`.
 */
export default function OnboardingPage() {
  return (
    // `isolate` because `HeroBackdrop` paints at a negative z-index and would otherwise
    // fall behind the page background and vanish.
    <main className="dark relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      {/*
        The full hero backdrop, doodles and all — unlike sign-in, which turns them off to
        leave room for video. Here they are the whole atmosphere: the page is one column
        of type and pills, and on a flat ground it would read as a form.
      */}
      <HeroBackdrop fadeDoodles={false} />

      {/* The wordmark leads, at a size that sits above the question rather than
          competing with it — this screen's headline is the question, not the brand. */}
      <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] leading-none font-bold tracking-tight">
        <GlassWordmark>Vyral</GlassWordmark>
      </h1>

      <p className="mt-4 mb-12 text-sm text-muted-foreground">
        Three quick questions and the studio is yours.
      </p>

      <OnboardingFlow />
    </main>
  );
}
