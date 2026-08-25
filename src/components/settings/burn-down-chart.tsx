import { type BurnPoint, type SpendForecast } from "@/components/settings/spending";
import { cn, formatDate, formatInteger } from "@/lib/utils";
import type { SpendCycle } from "@/types/spending";

/**
 * The plot box, in the SVG's own units.
 *
 * A `viewBox` rather than pixels, so the chart scales with the panel and every
 * measurement below stays a constant. The insets leave room for the axis labels drawn
 * outside the plot — a chart that has to reserve space for its own labels in CSS ends
 * up with the line and the labels disagreeing at some width.
 */
const W = 900;
const H = 210;
const PAD = { top: 14, right: 12, bottom: 22, left: 44 };
const PLOT = {
  x: PAD.left,
  y: PAD.top,
  w: W - PAD.left - PAD.right,
  h: H - PAD.top - PAD.bottom,
};

/**
 * Credits remaining across the cycle, with the projection drawn on.
 *
 * A burn-down rather than a bar per day. Bars answer "what did I spend on Tuesday",
 * which is rarely the question; a descending line answers "will this last", because the
 * slope *is* the rate and the point where it meets the floor is the day it runs out.
 * It is also the only chart shape where the forecast is the same object as the history
 * — the dashed section is literally the solid one continued.
 *
 * Server-rendered. Nothing here is interactive: the labels that matter are drawn on the
 * chart, which beats a tooltip you have to go looking for and works on a phone.
 */
export function BurnDownChart({
  points,
  cycle,
  outlook,
}: {
  points: BurnPoint[];
  cycle: SpendCycle;
  outlook: SpendForecast;
}) {
  const { allowance } = cycle;
  const { cycleDays, runsOutOnDay, remainingAtRenewal } = outlook;

  // Domain: the whole cycle on x whatever has happened so far, so the empty stretch to
  // the right *is* the time left. Rescaling to the data would hide it.
  const x = (day: number) => PLOT.x + (day / cycleDays) * PLOT.w;
  const y = (credits: number) => PLOT.y + (1 - credits / allowance) * PLOT.h;

  const last = points[points.length - 1] ?? { day: 0, remaining: allowance };

  const history = points.map((p) => `${x(p.day)},${y(p.remaining)}`).join(" ");

  // The projection stops at whichever comes first: zero, or renewal.
  const endDay = runsOutOnDay ?? cycleDays;
  const endCredits = runsOutOnDay === null ? remainingAtRenewal : 0;
  const projection = `${x(last.day)},${y(last.remaining)} ${x(endDay)},${y(endCredits)}`;

  const gridValues = [0, allowance / 2, allowance];

  return (
    <figure className="flex flex-col gap-2">
      {/*
        One `img` with a full text alternative rather than a labelled graphic: the shape
        is the whole message, and there is no way to walk a polyline usefully. The
        sentence below the chart says the same thing, but a screen reader should not
        have to hope the caption is nearby.
      */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Credits remaining across the cycle. ${formatInteger(
          Math.round(last.remaining),
        )} of ${formatInteger(allowance)} left on ${formatDate(cycle.asOf, {
          day: "numeric",
          month: "long",
        })}. ${
          runsOutOnDay === null
            ? `At the current pace about ${formatInteger(
                Math.round(remainingAtRenewal),
              )} credits will be unused when the allowance renews.`
            : "At the current pace the balance runs out before the allowance renews."
        }`}
        data-slot="burn-down"
        // Width-driven, not height-driven. With a fixed height and the default
        // `preserveAspectRatio`, a 4.3:1 viewBox in a 176px-tall box resolved to 563px
        // of drawing centred in a 1040px panel — the chart was letterboxed and did not
        // line up with the caption under it. Letting the intrinsic ratio set the height
        // makes it fill the panel at every width.
        className="h-auto w-full overflow-visible"
      >
        <defs>
          {/* The fill under the history. Fades out downwards so it reads as a shaded
              area rather than a solid block competing with the line on top of it. */}
          <linearGradient id="burn-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="color-mix(in oklab, var(--brand) 26%, transparent)"
            />
            <stop
              offset="100%"
              stopColor="color-mix(in oklab, var(--brand) 0%, transparent)"
            />
          </linearGradient>
        </defs>

        {/* Gridlines and their labels. Three is enough to read a proportion off; more
            would turn the plot into graph paper. */}
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PLOT.x}
              x2={PLOT.x + PLOT.w}
              y1={y(value)}
              y2={y(value)}
              stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
              strokeWidth={1}
            />
            <text
              x={PLOT.x - 8}
              y={y(value)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {formatInteger(value)}
            </text>
          </g>
        ))}

        {/* The area under the actual spend. Closed down to the axis and back, so the
            polygon is the history plus a floor. */}
        <polygon
          points={`${x(0)},${y(0)} ${history} ${x(last.day)},${y(0)}`}
          fill="url(#burn-fill)"
        />

        {/* What is projected. Dashed, and in the muted colour rather than the brand
            one, because a forecast that looks as solid as the history invites you to
            trust it as much. */}
        <polyline
          points={projection}
          fill="none"
          stroke={
            runsOutOnDay === null
              ? "color-mix(in oklab, var(--foreground) 35%, transparent)"
              : "var(--destructive)"
          }
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />

        <polyline
          points={history}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Today. A filled dot with a halo of the panel's own background, so the marker
            reads as sitting on the line rather than being a kink in it. */}
        <circle
          cx={x(last.day)}
          cy={y(last.remaining)}
          r={5.5}
          fill="var(--card)"
          stroke="var(--brand)"
          strokeWidth={2.5}
        />

        {/* The renewal edge, as a rule the projection runs into. */}
        <line
          x1={x(cycleDays)}
          x2={x(cycleDays)}
          y1={PLOT.y}
          y2={PLOT.y + PLOT.h}
          stroke="color-mix(in oklab, var(--foreground) 18%, transparent)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        <text
          x={PLOT.x}
          y={H - 4}
          className="fill-muted-foreground text-[11px]"
          textAnchor="start"
        >
          {formatDate(cycle.startsAt, { day: "numeric", month: "short" })}
        </text>
        <text
          x={x(cycleDays)}
          y={H - 4}
          className="fill-muted-foreground text-[11px]"
          textAnchor="end"
        >
          Renews {formatDate(cycle.renewsAt, { day: "numeric", month: "short" })}
        </text>
      </svg>

      {/* The chart's own sentence. A line that says what the shape means is the
          difference between a graphic and an answer. */}
      <figcaption
        className={cn(
          "text-xs leading-relaxed",
          runsOutOnDay === null ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {runsOutOnDay === null ? (
          <>
            At your pace over the last week you will finish this cycle with about{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatInteger(Math.round(remainingAtRenewal))} credits
            </span>{" "}
            unused.
          </>
        ) : (
          <>
            At your pace over the last week you run out about{" "}
            <span className="font-semibold tabular-nums">
              {Math.max(1, Math.round(cycleDays - runsOutOnDay))} days
            </span>{" "}
            before the allowance renews.
          </>
        )}
      </figcaption>
    </figure>
  );
}
