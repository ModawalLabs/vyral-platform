import { DoodleField } from "@/components/home/doodle-field";
import { cn } from "@/lib/utils";

/**
 * Everything painted behind the composer: the film-kit doodle field and the two
 * brand washes.
 *
 * Shared so the home hero and the `/new` screen sit on an identical backdrop —
 * `/new` builds its own layout on top, but the surface underneath must match or
 * the transition between the two reads as a different page.
 *
 * The parent must establish a stacking context (`isolate`), or the whole
 * backdrop slides behind the page background and disappears.
 */
export function HeroBackdrop({
  fadeDoodles = true,
  dimmed = false,
  doodles = true,
}: {
  fadeDoodles?: boolean;
  /** Pull the decoration back once there is real work on screen. */
  dimmed?: boolean;
  /**
   * Draw the film-kit doodle field.
   *
   * Off where something else is going to occupy the background — the sign-in screen is
   * getting video behind it. The two brand washes stay either way: they are what gives
   * the glass wordmark something with colour to refract, and they are tuned values that
   * should not be copied into a second file just to drop the doodles.
   */
  doodles?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 isolate -z-10 transition-opacity duration-700 ease-out motion-reduce:transition-none",
        dimmed && "opacity-35",
      )}
    >
      {doodles ? <DoodleField fadeBottom={fadeDoodles} /> : null}

      {/*
        The glass title has a translucent fill, so it needs something with
        colour behind it or it reads as flat grey type. These two washes are
        that backdrop — offset from the word rather than centred on it, so the
        refraction is directional.

        Radial gradients rather than a solid circle plus `blur`: blur clips at
        the element's box, which leaves a faint seam at high radii, and its
        falloff is a hard-edged disc smeared outward. An explicit multi-stop
        ramp fades all the way to nothing.
      */}
      <div className="absolute top-[6%] left-1/2 size-[34rem] -translate-x-[78%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_16%,transparent),color-mix(in_oklab,var(--brand)_7%,transparent)_45%,transparent_78%)] blur-[60px]" />
      <div className="absolute top-[16%] left-1/2 size-[30rem] -translate-x-[6%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-accent)_13%,transparent),color-mix(in_oklab,var(--brand-accent)_6%,transparent)_45%,transparent_78%)] blur-[60px]" />
    </div>
  );
}
