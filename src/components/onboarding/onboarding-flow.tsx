"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StepIndicator } from "@/components/onboarding/step-indicator";
import { ONBOARDING_STEPS, type OnboardingOption } from "@/components/onboarding/steps";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

/**
 * The first-run questions.
 *
 * One choice per step, three steps, then into the workspace. Nothing is persisted —
 * this exists to walk the flow and see how it feels, so the answers live in component
 * state and go no further.
 *
 * The step lives in state rather than the URL. A `?step=` param would make each question
 * linkable, which is the opposite of what a first-run flow wants: landing on step 3 with
 * the first two unanswered is a broken state, and there is nothing worth returning to.
 *
 * TODO: persist the answers and seed the session's settings from the platform step.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  /** Keyed by step id, so going back shows what you already picked. */
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const step = ONBOARDING_STEPS[index];
  const chosen = choices[step.id];
  const isLast = index === ONBOARDING_STEPS.length - 1;

  // Continue is gated on having answered. Free-text is deliberately *not* required —
  // "Other" is already an answer, and demanding elaboration to proceed would turn the
  // easiest option into the most expensive one.
  const canContinue = Boolean(chosen);

  const choose = (option: OnboardingOption) =>
    setChoices((current) => ({ ...current, [step.id]: option.id }));

  const next = () => {
    if (!canContinue) return;
    if (isLast) {
      router.push(routes.home);
      return;
    }
    setIndex((current) => current + 1);
  };

  const freeTextOpen = step.options.some(
    (option) => option.freeText && option.id === chosen,
  );

  return (
    <div className="w-full max-w-2xl">
      <StepIndicator steps={ONBOARDING_STEPS.map((s) => s.short)} current={index} />

      {/*
        Keyed on the step so the whole panel remounts between questions.

        That is what re-runs the entry animation, and it also guarantees the free-text
        field cannot carry a value from one step into the next — React would otherwise
        reuse the input by position.
      */}
      <div key={step.id} className="animate-phrase-in mt-10">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {step.heading}
        </h2>
        <p className="mt-3 text-muted-foreground">{step.subtext}</p>

        {/*
          A radio group, not a set of buttons: one answer at a time is the whole model
          here, and `radio` is what tells a screen reader that picking one clears the
          others. Arrow keys move between them for free.
        */}
        <div
          role="radiogroup"
          aria-label={step.heading}
          data-slot="onboarding-options"
          className="mt-8 flex flex-wrap gap-3"
        >
          {step.options.map((option) => {
            const isActive = option.id === chosen;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => choose(option)}
                className={cn(
                  "group/pill relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border py-3 pr-5 pl-4",
                  "text-sm font-medium transition-[color,border-color,box-shadow,background-color] duration-300",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  // The frosted plate, as utilities — see `GLASS_SURFACE` in
                  // `components/create/glass` for why this cannot be the `.glass-frame`
                  // class. Restated here rather than imported because these pills also
                  // need a *selected* plate, which that constant deliberately has no
                  // opinion about.
                  "backdrop-blur-2xl backdrop-saturate-150",
                  isActive
                    ? // Lit rather than merely outlined: brand fill at low alpha, a brand
                      // edge, and a bloom so the chosen pill reads as the only warm thing
                      // in the row.
                      "border-brand/55 bg-brand/[0.14] text-foreground shadow-[0_0_24px_-6px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
                    : "border-glass-border bg-glass text-muted-foreground hover:border-white/25 hover:text-foreground hover:brightness-110",
                )}
              >
                {/* Specular line along the top bevel — the detail that makes a
                    translucent chip read as a lit edge rather than a flat tint. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-glass-sheen to-transparent"
                />

                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full transition-colors",
                    isActive
                      ? "bg-brand text-brand-foreground"
                      : "bg-white/[0.07] text-muted-foreground group-hover/pill:text-foreground",
                  )}
                >
                  {isActive ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <option.Icon className="size-3.5" />
                  )}
                </span>

                {option.label}
              </button>
            );
          })}
        </div>

        {/* Revealed only by the free-text option, so "Other" leads somewhere instead of
            being a dead end. Optional — see `canContinue`. */}
        {freeTextOpen ? (
          <div className="animate-phrase-in mt-5">
            <label htmlFor={`onboarding-${step.id}-note`} className="sr-only">
              Tell us more
            </label>
            <input
              id={`onboarding-${step.id}-note`}
              value={notes[step.id] ?? ""}
              onChange={(event) =>
                setNotes((current) => ({ ...current, [step.id]: event.target.value }))
              }
              placeholder="In your own words…"
              className="h-11 w-full rounded-xl bg-white/[0.04] px-3.5 text-sm text-foreground ring-1 ring-white/12 transition-colors ring-inset placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand/55 focus-visible:outline-none"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-12 flex items-center gap-3">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => current - 1)}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back
          </button>
        ) : null}

        {/*
          `ml-auto` so the primary action stays on the right whether or not Back is
          there — anchoring it to the row's end means it does not move between step 1
          and step 2.
        */}
        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          // Disabled with a reason rather than silently inert: this one *will* work,
          // as soon as there is an answer.
          title={canContinue ? undefined : "Pick an option to continue"}
          className={cn(
            "ml-auto inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold",
            "bg-gradient-to-r from-brand to-brand-accent text-brand-foreground",
            "shadow-lg shadow-brand/25 transition-[filter,opacity] hover:brightness-110",
            "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {isLast ? "Enter the studio" : "Continue"}
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
