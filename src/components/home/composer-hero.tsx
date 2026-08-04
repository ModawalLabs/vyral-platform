import { GlassWordmark } from "@/components/home/glass-wordmark";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HomeComposer } from "@/components/home/home-composer";
import { Typewriter } from "@/components/ui/typewriter";
import { CURRENT_USER } from "@/config/current-user";
import { cn } from "@/lib/utils";

/**
 * Wordmark, greeting and composer — the centrepiece of the home page.
 *
 * `/new` deliberately does not use this: it needs the same three pieces laid
 * out independently so the composer can travel across the screen when a
 * session starts. It shares `HeroBackdrop` instead, which is the part that has
 * to match.
 *
 * Must be rendered inside a `ComposerProvider`.
 */
export function ComposerHero({
  className,
  fadeDoodles = true,
}: {
  className?: string;
  /** Off when this section fills the viewport and has nothing to abut. */
  fadeDoodles?: boolean;
}) {
  return (
    // `overflow-hidden` is what crops the doodle field to this section.
    <section
      className={cn(
        "relative isolate flex flex-col items-center justify-center overflow-hidden px-6",
        className,
      )}
    >
      <HeroBackdrop fadeDoodles={fadeDoodles} />

      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.95] font-bold tracking-tight">
          <GlassWordmark>Vyral</GlassWordmark>
        </h1>

        <p className="mt-8 text-xl text-pretty text-muted-foreground sm:text-2xl">
          <Typewriter text={`Hello ${CURRENT_USER.firstName}, Ready to get creative?`} />
        </p>

        <div className="mt-9 w-full">
          <HomeComposer />
        </div>
      </div>
    </section>
  );
}
