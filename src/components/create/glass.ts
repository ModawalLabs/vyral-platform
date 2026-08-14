import { cn } from "@/lib/utils";

/**
 * The frosted plate, as utilities rather than the `.glass-frame` class.
 *
 * `.glass-frame` lives in `@layer components`, which loses to `@layer utilities` — so
 * on any control that already carries a background utility, its background and border
 * never applied and the control was not actually glass. Written as utilities,
 * tailwind-merge replaces the caller's background and border cleanly and the cascade
 * has nothing left to argue about.
 *
 * Shared rather than restated: the session settings bar and the composer's scene picker
 * both need this exact plate, and a second hand-written copy is how the two would drift.
 * The hover pair is part of the treatment — without it a caller's own hover swaps the
 * plate back out for a flat tint.
 */
export const GLASS_SURFACE = cn(
  "border-glass-border bg-glass backdrop-blur-2xl backdrop-saturate-150",
  "hover:border-glass-border hover:bg-glass hover:brightness-110",
);
