import { Sparkles } from "lucide-react";

import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { BrandButton } from "@/components/ui/brand-button";
import { formatDate } from "@/lib/utils";
import type { CreditBalance } from "@/types/account";

const number = (value: number) => new Intl.NumberFormat("en-US").format(value);

/**
 * Ring geometry, in the SVG's own 120-unit box.
 *
 * The radius has to leave room for half the stroke on each side or the arc clips at
 * the viewBox edge: 52 + 12/2 = 58, inside 60.
 */
const RADIUS = 52;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * What is left to generate with.
 *
 * A ring rather than a bar. Both encode one proportion, but a bar is a strip of page
 * furniture while a ring is a dial — it can hold the number in its middle, so the
 * balance and the proportion become one object instead of a figure with a rule under
 * it. It is also the only round element on a page of rectangles, which is what makes
 * this panel read as the page's second focal point after the avatar.
 */
export function CreditsCard({ credits }: { credits: CreditBalance }) {
  const { available, allowance, creditsPerVideo } = credits;

  // Clamped: a top-up can legitimately push the balance past the monthly allowance,
  // and an unclamped arc would wrap back over its own start.
  const percent = Math.min(100, Math.round((available / allowance) * 100));
  const used = Math.max(0, allowance - available);
  const videosLeft = Math.floor(available / creditsPerVideo);

  return (
    <Panel>
      <PanelBevel />

      {/* A bloom behind the ring, sized and placed to sit under it. This is what stops
          the dial looking like a chart pasted onto a white card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 size-64 -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_75%)] blur-xl"
      />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <PanelLabel>Credits</PanelLabel>

        {/*
          `progressbar` on the wrapper with the SVG marked decorative, rather than
          labelling the arc itself: the arc is one of two overlapping circles and means
          nothing on its own, while the wrapper is what visually *is* the gauge.
          `aria-valuetext` because "1240" alone does not say what it counts.
        */}
        <div
          role="progressbar"
          aria-label="Credits remaining this cycle"
          aria-valuemin={0}
          aria-valuemax={allowance}
          aria-valuenow={available}
          aria-valuetext={`${number(available)} of ${number(allowance)} credits remaining`}
          data-slot="credit-meter"
          className="relative mx-auto grid size-40 shrink-0 place-items-center"
        >
          <svg viewBox="0 0 120 120" aria-hidden className="size-full -rotate-90">
            <defs>
              <linearGradient id="credit-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--brand)" />
                <stop offset="100%" stopColor="var(--brand-accent)" />
              </linearGradient>
            </defs>

            {/*
              The unfilled remainder, as a low alpha of `--foreground` rather than
              `--border`. `--border` is an opaque light grey in one theme and 10% white
              in the other, so at 12px it came out as a solid grey donut on the light
              card while staying a whisper on the dark one. An alpha of the foreground
              flips with the theme and lands at the same faintness in both.
            */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="color-mix(in oklab, var(--foreground) 9%, transparent)"
              strokeWidth={STROKE}
            />

            {/* `strokeLinecap="round"` is the whole difference between a dial and a pie
                slice — and it is why the arc must not reach a full turn, or the two
                round caps overlap into a visible lump. */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="url(#credit-arc)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            />
          </svg>

          {/* Absolutely centred rather than a grid child, because the SVG is rotated
              and a sibling in the same cell would inherit nothing of that but would
              still be measured against the rotated box. */}
          <span className="absolute inset-0 grid place-items-center text-center">
            <span>
              <span className="block font-heading text-3xl font-semibold tracking-tight tabular-nums">
                {number(available)}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground tabular-nums">
                of {number(allowance)}
              </span>
            </span>
          </span>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground tabular-nums">
            {number(used)} used · renews{" "}
            {formatDate(credits.renewsAt, { day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-muted-foreground">
            Roughly{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {videosLeft} videos
            </span>{" "}
            left at {creditsPerVideo} each.
          </p>
        </div>

        {/* `mt-auto` pins the button to the bottom, so it lines up with the base of the
            taller profile panel beside it. TODO: opens checkout once billing exists. */}
        <BrandButton
          title="Buying credits is not wired up yet"
          className="mt-auto w-full justify-center"
        >
          <Sparkles aria-hidden className="size-4" />
          Buy credits
        </BrandButton>
      </div>
    </Panel>
  );
}
