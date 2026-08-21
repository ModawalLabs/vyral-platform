"use client";

import { Check, Lock } from "lucide-react";

import { useSession } from "@/components/create/session-provider";
import { ASPECT_RATIOS } from "@/components/home/composer-settings";
import { cn } from "@/lib/utils";

/**
 * What the workspace half shows while the director is still asking.
 *
 * A slate and a call sheet, not a spinner. A spinner says "wait"; this says what is
 * being set up and how far along it is — and because the checklist advances on each
 * answer, the right half visibly responds to the left one instead of sitting inert
 * until it is swapped out.
 */
export function IntakeStage() {
  const { prompt, settings, intakeStep, intakeTyping, intakeQuestionCount } =
    useSession();

  const aspect =
    ASPECT_RATIOS.find((option) => option.value === settings.aspectRatio) ??
    ASPECT_RATIOS[0];

  /**
   * The pipeline, and where the intake has got to.
   *
   * The first two rows are driven by `intakeStep`, so answering a question ticks a box
   * here. The rest are locked because they genuinely are — they need a brief that does
   * not exist yet.
   */
  const steps: readonly { label: string; state: StepState; note?: string }[] = [
    { label: "Brief received", state: "done" },
    { label: "Format locked", state: intakeStep >= 1 ? "done" : "active" },
    {
      label: "Direction agreed",
      state: intakeStep >= 2 ? "done" : intakeStep >= 1 ? "active" : "locked",
    },
    // The note is per-row, not derived from `locked`. These two are waiting on a brief
    // that does not exist yet; "Direction agreed" is only waiting its turn, and
    // labelling it "needs the brief" contradicted the ticked row three lines above it.
    { label: "Screenplay", state: "locked", note: "needs the brief" },
    { label: "Asset library", state: "locked", note: "needs the brief" },
  ];

  return (
    <div
      data-slot="intake-stage"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-10 py-8"
    >
      <Slate
        production={prompt}
        format={`${aspect.value} · ${aspect.label}`}
        runtime={`${settings.durationSeconds}s`}
        model={settings.model}
        busy={intakeTyping}
      />

      {/* Same max width as the slate, so the checklist sits on its left edge instead
          of floating narrower and centred under it. */}
      <div className="w-full max-w-md">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Pre-production
        </p>

        <ol className="mt-4 space-y-3">
          {steps.map((step) => (
            <StepRow
              key={step.label}
              label={step.label}
              state={step.state}
              note={step.note}
            />
          ))}
        </ol>

        {/* A count, not a bar: there are three states here and two of them are
            waiting on a person, which a percentage would misrepresent as progress. */}
        <p
          role="status"
          className="mt-6 text-xs text-muted-foreground"
          data-slot="intake-progress"
        >
          {intakeStep} of {intakeQuestionCount} answered
          {intakeStep < intakeQuestionCount
            ? " — answer in the chat to continue."
            : " — opening the workspace."}
        </p>
      </div>
    </div>
  );
}

type StepState = "done" | "active" | "locked";

function StepRow({
  label,
  state,
  note,
}: {
  label: string;
  state: StepState;
  /** Why this row is inert, when "locked" alone would be a riddle. */
  note?: string;
}) {
  return (
    <li
      data-slot="intake-step"
      data-state={state}
      className={cn(
        "flex items-center gap-3 text-sm",
        state === "done" && "text-foreground",
        state === "active" && "font-medium text-foreground",
        state === "locked" && "text-muted-foreground/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full ring-1 transition-colors ring-inset",
          state === "done" && "bg-success/12 text-success ring-success/30",
          state === "active" && "bg-brand/12 text-brand-text ring-brand/35",
          state === "locked" && "text-muted-foreground/50 ring-foreground/10",
        )}
      >
        {state === "done" ? (
          <Check className="size-3" strokeWidth={3} />
        ) : state === "active" ? (
          // The only pulse on the page, on the one row that is waiting for you.
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
        ) : (
          <Lock className="size-2.5" />
        )}
      </span>

      {label}

      {note ? (
        <span className="ml-auto text-[11px] text-muted-foreground/60">{note}</span>
      ) : null}
    </li>
  );
}

/**
 * A clapperboard.
 *
 * Deliberately dark in both themes. A slate is an object rather than a surface — a real
 * one is black with white stripes, and lightening it for the light theme would make it
 * a grey rectangle instead of a recognisable prop. It is also the one thing on this
 * screen that says "film" before any text is read.
 */
function Slate({
  production,
  format,
  runtime,
  model,
  busy,
}: {
  production: string;
  format: string;
  runtime: string;
  model: string;
  /** Runs the light sweep, so the slate reads as live while the director writes. */
  busy: boolean;
}) {
  return (
    /*
      The wrapper is not clipped and carries the headroom the raised stick needs.
      `pt-9` is measured against the rotation below, not guessed: at 5 degrees across a
      28rem board the free end lifts about 39px, so anything less clips the corner off.
    */
    <div data-slot="intake-slate" className="relative w-full max-w-md pt-9">
      {/*
        The clapper, held open rather than shut.

        Two jaws, because that is what a slate is: this one is the hinged stick, rotated
        about its own bottom-left corner so the left end stays on the pivot and the right
        end swings up. The fixed jaw is the strip on the board below, and the wedge of
        page background between them is the open mouth.

        A closed clapper reads as a stripe along the top of a card. An open one reads as
        a prop that is about to be struck — which is the whole point of putting it here
        while the director is still asking questions.
      */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-9 h-6 origin-bottom-left -rotate-[5deg] rounded-t-sm bg-[repeating-linear-gradient(115deg,#f4f4f5_0_20px,#111114_20px_40px)] shadow-lg shadow-black/40"
      />

      <div className="relative overflow-hidden rounded-2xl bg-[#111114] shadow-2xl ring-1 shadow-black/30 ring-white/10 ring-inset dark:shadow-black/60">
        {/* The fixed jaw. Shallower than the stick above it, so the two do not read as
            a matched pair of stripes — on a real slate the moving stick is the deeper
            of the two. */}
        <div
          aria-hidden
          className="h-3.5 w-full bg-[repeating-linear-gradient(115deg,#f4f4f5_0_20px,#111114_20px_40px)]"
        />

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 px-5 py-5 text-white">
          <SlateRow label="Production">
            {/* The user's own prompt, clamped to two lines: it is the one field here with
              unbounded length, and a slate that grows with the brief stops looking
              like a slate. */}
            <span className="line-clamp-2">{production}</span>
          </SlateRow>
          <SlateRow label="Director">AI Director</SlateRow>
          <SlateRow label="Format">{format}</SlateRow>
          <SlateRow label="Runtime">{runtime}</SlateRow>
          <SlateRow label="Model">{model}</SlateRow>
          {/* Blank on purpose. Nothing has been shot, so the fields a slate exists to
            record are empty — which is a truer "not started" than a placeholder. */}
          <SlateRow label="Scene / Take">
            <span className="text-white/35">— / —</span>
          </SlateRow>
        </dl>

        {busy ? (
          // Reuses the render card's sweep so the two "working" states in this app move
          // the same way, rather than each inventing its own.
          <span
            aria-hidden
            className="animate-render-sheen pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          />
        ) : null}
      </div>
    </div>
  );
}

function SlateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-sm leading-snug font-medium">{children}</dd>
    </>
  );
}
