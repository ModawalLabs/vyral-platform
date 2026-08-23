import { cn } from "@/lib/utils";

/**
 * Where you are in the flow.
 *
 * One track per step rather than a single bar with a moving fill: three steps is few
 * enough that they can each be their own object, which shows how many are left as well
 * as how far along you are — a continuous bar only ever answers the second question.
 *
 * The labels are what make it a map instead of a progress meter. Knowing the next
 * question is "Audience" is the difference between three unknowns and three named ones.
 */
export function StepIndicator({
  steps,
  current,
}: {
  /** Short labels, in order. */
  steps: readonly string[];
  /** Zero-based index of the step being answered. */
  current: number;
}) {
  return (
    <div data-slot="step-indicator" className="w-full">
      {/* Announced rather than left to the tracks, which are decoration: a screen
          reader gets "Step 2 of 3" instead of three unlabelled bars. */}
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        <span className="sr-only">Progress: </span>
        Step {current + 1} of {steps.length}
      </p>

      <ol aria-hidden className="mt-3 flex items-center gap-3">
        {steps.map((label, index) => {
          const state =
            index < current ? "done" : index === current ? "active" : "upcoming";

          return (
            <li key={label} data-state={state} className="min-w-0 flex-1">
              {/*
                `overflow-hidden` on the track with a scaled child, rather than animating
                width: a transform runs on the compositor and cannot reflow the row, and
                `origin-left` is what makes it read as filling rather than growing from
                the middle.
              */}
              <span className="block h-[3px] overflow-hidden rounded-full bg-foreground/10">
                <span
                  className={cn(
                    "block h-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none",
                    state === "upcoming" ? "scale-x-0" : "scale-x-100",
                    state === "active"
                      ? "bg-gradient-to-r from-brand to-brand-accent"
                      : "bg-brand/45",
                  )}
                />
              </span>

              <span
                className={cn(
                  "mt-2 block truncate text-[11px] transition-colors",
                  state === "active"
                    ? "font-semibold text-foreground"
                    : state === "done"
                      ? "text-muted-foreground"
                      : "text-muted-foreground/45",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
