import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A premium card shell, for pages that need more presence than `Card` gives.
 *
 * Not `Card`: that is shadcn CLI output, gets overwritten by `npx shadcn add`, and
 * draws a flat `ring-1` on all four sides. Premium depth comes from light having a
 * direction — so the border here is a *gradient* hairline, bright along the top edge
 * and fading to almost nothing by the bottom, which is what a physical bevel does.
 *
 * Built as a 1px gradient bed with an opaque panel sitting inside it, because a
 * gradient cannot be a `border-color`. The inner radius is the outer one minus that
 * 1px, or the two curves drift apart and the corner shows a bright wedge.
 *
 * `h-full` on both layers so a grid row of these stretches to the tallest — without it
 * the bed stretches and the panel inside it does not, leaving a bare gradient margin
 * hanging off the shorter card.
 */
export function Panel({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // `min-w-0` because this is a grid item, and a grid item defaults to
        // `min-width: auto` — it refuses to shrink below its content's min-content
        // width, which pushed the track 2px past the viewport on a narrow window and
        // gave the page a horizontal scrollbar. `h-full` so a row of these stretches
        // to the tallest.
        "h-full min-w-0 rounded-2xl bg-gradient-to-b from-foreground/[0.16] via-foreground/[0.07] to-foreground/[0.04] p-px",
        // Two shadows: a tight contact shadow to seat the card, and a wide soft one
        // for lift. Heavier in dark mode, where a shadow has to work against a
        // near-black page instead of white.
        "shadow-[0_1px_2px_-1px_var(--tw-shadow-color),0_16px_40px_-24px_var(--tw-shadow-color)]",
        "shadow-black/15 dark:shadow-black/60",
        className,
      )}
      {...props}
    >
      <div
        data-slot="panel"
        className="relative isolate flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-2xl)-1px)] bg-card"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The specular line along a panel's top bevel.
 *
 * Inset from the corners so it fades out before the curve — run edge to edge and it
 * cuts a chord across the radius. Same detail the composer's glass frame uses; it is
 * the cheapest thing that makes a flat rectangle read as a lit surface.
 */
export function PanelBevel() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-glass-sheen to-transparent"
    />
  );
}

/** Small caps section label. One treatment, so the three panels read as a set. */
export function PanelLabel({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
