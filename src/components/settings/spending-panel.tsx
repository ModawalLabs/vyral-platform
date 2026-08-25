"use client";

import { ChevronRight, Clapperboard, Cpu, TrendingUp, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

import { BurnDownChart } from "@/components/settings/burn-down-chart";
import { SpendBreakdown } from "@/components/settings/spend-breakdown";
import {
  burnDown,
  cycleSummary,
  entriesFor,
  forecast,
  groupSpend,
  otherDimension,
  type Dimension,
  type SpendGroup,
} from "@/components/settings/spending";
import { Panel, PanelBevel } from "@/components/ui/panel";
import { cn, formatDate, formatInteger } from "@/lib/utils";
import type { SpendCycle, SpendEntry } from "@/types/spending";

const DIMENSIONS: { value: Dimension; label: string; noun: string }[] = [
  { value: "project", label: "Project", noun: "project" },
  { value: "model", label: "Model", noun: "model" },
];

/**
 * Where the credits went.
 *
 * Three layers, in the order the questions get asked: how much is left and will it last
 * (the burn-down), where it went (the breakdown), and why (drilling one row into the
 * other dimension). Anything less is a chart; anything more is a dashboard nobody
 * reads.
 *
 * The drill is exactly two deep and cuts by the axis you did not pick — open a project
 * and you get its models, open a model and you get its projects. That is the whole
 * cross-tabulation of the two dimensions, and a third level would only ever repeat one
 * of the first two.
 *
 * A client component because the group-by and the drill are both local state that
 * nothing else on the page reads. The ledger itself arrives from the server, which is
 * what keeps `src/data/spending.ts` `server-only`.
 */
export function SpendingPanel({
  entries,
  cycle,
}: {
  entries: SpendEntry[];
  cycle: SpendCycle;
}) {
  const [dimension, setDimension] = useState<Dimension>("project");
  /** The row that has been opened, or null at the top level. */
  const [drilled, setDrilled] = useState<SpendGroup | null>(null);

  const summary = useMemo(() => cycleSummary(entries, cycle), [entries, cycle]);
  const points = useMemo(() => burnDown(entries, cycle), [entries, cycle]);
  const outlook = useMemo(() => forecast(entries, cycle), [entries, cycle]);

  // Which entries the breakdown is drawn from, and how they are cut. At the top level
  // that is everything by the chosen dimension; drilled, it is one group's entries by
  // the other one.
  const inner = drilled ? otherDimension(dimension) : dimension;
  const scope = useMemo(
    () => (drilled ? entriesFor(entries, dimension, drilled.key) : entries),
    [entries, drilled, dimension],
  );
  const groups = useMemo(() => groupSpend(scope, inner), [scope, inner]);

  /** Switching the axis at the top level; from inside a drill it also backs out. */
  const chooseDimension = (next: Dimension) => {
    setDimension(next);
    setDrilled(null);
  };

  return (
    <Panel>
      <PanelBevel />

      <div className="@container flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {/* No panel label: the tab above already names this section. */}
          <div>
            <p className="text-sm text-muted-foreground">
              Every render this cycle, and what it cost. Open a row to see the breakdown
              underneath it.
            </p>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatDate(cycle.startsAt, { day: "numeric", month: "short" })} –{" "}
            {formatDate(cycle.asOf, { day: "numeric", month: "short" })}
          </p>
        </div>

        {/* The four figures worth knowing before looking at anything. Measured against
            the panel rather than the viewport: at a 640px viewport this panel is much
            narrower than `sm:` assumes, and four tiles on one row there would be 90px
            each. */}
        <div className="grid gap-3 @min-[30rem]:grid-cols-2 @min-[52rem]:grid-cols-4">
          <Stat
            Icon={Wand2}
            label="Spent this cycle"
            value={`${formatInteger(summary.total)} cr`}
            detail={`${Math.round(summary.shareOfAllowance * 100)}% of your allowance`}
          />
          <Stat
            Icon={TrendingUp}
            label="Daily average"
            value={`${formatInteger(Math.round(summary.perDay))} cr`}
            detail={`${summary.renders} renders so far`}
          />
          <Stat
            Icon={Clapperboard}
            label="Biggest project"
            value={summary.topProject?.label ?? "—"}
            detail={
              summary.topProject
                ? `${formatInteger(summary.topProject.credits)} cr · ${Math.round(
                    summary.topProject.share * 100,
                  )}% of spend`
                : "Nothing yet"
            }
          />
          <Stat
            Icon={Cpu}
            label="Most used model"
            value={summary.topModel?.label ?? "—"}
            detail={
              summary.topModel
                ? `${formatInteger(summary.topModel.credits)} cr · ${Math.round(
                    summary.topModel.share * 100,
                  )}% of spend`
                : "Nothing yet"
            }
          />
        </div>

        <BurnDownChart points={points} cycle={cycle} outlook={outlook} />

        <div className="flex flex-col gap-3">
          {drilled ? (
            <DrillHeader
              group={drilled}
              dimension={dimension}
              innerNoun={inner === "project" ? "project" : "model"}
              onBack={() => setDrilled(null)}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight">Where it went</h3>

              {/* A segmented control, not a dropdown: there are two options and the one
                  that is not selected is the other question you might be asking, so it
                  is worth having on screen. */}
              <div
                role="group"
                aria-label="Group spending by"
                className="inline-flex items-center gap-0.5 rounded-xl bg-foreground/[0.05] p-0.5"
              >
                {DIMENSIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => chooseDimension(option.value)}
                    aria-pressed={dimension === option.value}
                    data-slot="group-by"
                    data-dimension={option.value}
                    className={cn(
                      "rounded-[0.625rem] px-3 py-1.5 text-xs font-medium transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
                      dimension === option.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    By {option.label.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SpendBreakdown
            groups={groups}
            // Only the top level drills. Two deep is the whole cross-tabulation, so a
            // third chevron would promise something that does not exist.
            onDrill={drilled ? undefined : (group) => setDrilled(group)}
            emptyMessage="No renders this cycle yet."
          />
        </div>
      </div>
    </Panel>
  );
}

function Stat({
  Icon,
  label,
  value,
  detail,
}: {
  Icon: typeof Wand2;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-foreground/[0.02] p-3.5 ring-1 ring-foreground/[0.06] ring-inset">
      <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </span>
      {/* `truncate` because a project title can be any length and this tile is one of
          four on a row — wrapping one tile would make its neighbours short. */}
      <span
        className="truncate font-heading text-lg font-semibold tracking-tight"
        title={value}
      >
        {value}
      </span>
      <span className="truncate text-xs text-muted-foreground tabular-nums">
        {detail}
      </span>
    </div>
  );
}

/** Where you are inside the drill, and the way back out. */
function DrillHeader({
  group,
  dimension,
  innerNoun,
  onBack,
}: {
  group: SpendGroup;
  dimension: Dimension;
  innerNoun: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <nav aria-label="Breakdown" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          <li>
            <button
              type="button"
              onClick={onBack}
              className="rounded px-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              By {dimension}
            </button>
          </li>
          <li aria-hidden className="text-muted-foreground/50">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="min-w-0">
            <h3 aria-current="page" className="truncate font-semibold tracking-tight">
              {group.label}
            </h3>
          </li>
        </ol>
      </nav>

      {/* States the denominator outright. Inside a drill the percentages change meaning
          — they are shares of this group, not of the cycle — and a reader who missed
          that would read every number below wrongly. */}
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatInteger(group.credits)} cr over {group.renders}{" "}
        {group.renders === 1 ? "render" : "renders"} · split by {innerNoun}
      </p>
    </div>
  );
}
