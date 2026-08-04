"use client";

import { Check, Info, Pencil, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { RevisionRail } from "@/components/create/revision-rail";
import { useSession } from "@/components/create/session-provider";
import { SessionSettingsBar } from "@/components/create/session-settings-bar";
import { ScreenplayTab } from "@/components/create/tabs/screenplay-tab";
import { TestScreening } from "@/components/create/test-screening";
import { BrandOutlineButton } from "@/components/ui/brand-button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { changedSettings } from "@/lib/session/brief";
import { deriveRationale, profileFor } from "@/lib/session/models";
import type { SessionSettings } from "@/types/session";
import { cn } from "@/lib/utils";

/** Everything one Edit session can touch, held together so Save is atomic. */
type Draft = { text: string; settings: SessionSettings };

/**
 * The brief: the settings the film is being made under, the prose written to them,
 * then the screenplay that follows from both.
 *
 * Settings sit directly above the story rather than in a column beside it, because
 * they are the constraints the prose is answering — you cannot judge a 10-second
 * vertical Reel script against controls you have to scroll to. One Edit button
 * governs both, and one Save lands them as a single revision, so the history is a
 * list of decisions rather than a list of keystrokes.
 */
export function BriefTab() {
  const {
    story,
    activeStory,
    settings,
    saveRevision,
    activateStoryVersion,
    scenesGenerated,
    generateScenes,
  } = useSession();

  const [draft, setDraft] = useState<Draft | null>(null);
  const editing = draft !== null;

  // What is on screen: the draft while editing, the active revision otherwise.
  const shown: Draft = draft ?? { text: activeStory.text, settings };

  const changed = editing ? changedSettings(settings, draft.settings) : [];
  const storyChanged = editing && draft.text.trim() !== activeStory.text;
  const dirty = storyChanged || changed.length > 0;

  const set = (patch: Partial<SessionSettings>) =>
    setDraft((current) =>
      current ? { ...current, settings: { ...current.settings, ...patch } } : current,
    );

  function save() {
    if (!draft) return;
    // A no-op edit should not manufacture a revision to scroll past later.
    if (dirty) saveRevision(draft.text.trim(), draft.settings);
    setDraft(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* No revision label above the strip: it marks the active card itself, and a
          second copy of "Revision 2" was saying the same thing twice. */}
      <RevisionRail
        revisions={story.versions.map((version) => ({
          id: version.id,
          label: `Revision ${version.revision}`,
          // Without this a settings-only revision is indistinguishable from the
          // one it came from — same prose, and nothing on the card to say why it
          // exists.
          meta: [
            version.settings.model,
            version.settings.aspectRatio,
            `${version.settings.durationSeconds}s`,
          ].join(" · "),
          preview: version.text,
        }))}
        activeId={activeStory.id}
        onSelect={activateStoryVersion}
        locked={editing}
      />

      {/* One card holding the whole brief, so it reads as a single thing that Edit
          acts on rather than two panels that happen to sit together.

          `isolate` is what keeps the `-z-10` texture inside this card: within a
          stacking context a negative z-index paints above the context's own
          background but below its in-flow content, which is exactly the sandwich
          wanted here. Without it the layer would slide behind the panel entirely. */}
      <div
        data-slot="brief-card"
        className="relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4"
      >
        <span
          aria-hidden
          data-slot="brief-texture"
          className="brief-texture pointer-events-none absolute inset-0 -z-10"
        />
        {/* Edit sits immediately after the heading rather than across the card from
            it, so the label and the thing that unlocks it read as one control. */}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold">Brief</h3>

          <div className="flex shrink-0 items-center gap-1.5">
            {editing ? (
              <>
                <ToolButton onClick={() => setDraft(null)} label="Cancel" Icon={X} />
                <ToolButton
                  onClick={save}
                  label="Save revision"
                  Icon={Check}
                  primary
                  disabled={!dirty}
                />
              </>
            ) : (
              <ToolButton
                onClick={() => setDraft({ text: activeStory.text, settings })}
                label="Edit"
                Icon={Pencil}
              />
            )}
          </div>

          {editing ? (
            <span className="min-w-0 text-xs font-medium text-stale">
              {dirty
                ? `Unsaved · ${[storyChanged && "story", ...changed].filter(Boolean).join(", ")}`
                : "Editing"}
            </span>
          ) : null}
        </div>

        {/*
          Two rows, not two columns: the settings collapsed from a table of four
          labelled rows into a single row of pills, which no longer needs a column of
          its own — and the story reads better across the full width of the card than
          down half of it.
        */}
        <div data-slot="brief-rows" className="mt-4 flex flex-col gap-4">
          <SessionSettingsBar
            settings={shown.settings}
            onChange={set}
            // Locked until Edit: the pills stay on screen showing the applied values
            // rather than being swapped for read-only text, so nothing moves.
            disabled={!editing}
            modelInfo={
              <ModelDetails
                model={shown.settings.model}
                settings={shown.settings}
                previewing={changed.includes("Model")}
              />
            }
          />

          <div className="glass-frame relative overflow-hidden rounded-2xl p-5">
            {editing ? (
              <textarea
                autoFocus
                value={draft.text}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, text: event.target.value } : current,
                  )
                }
                rows={8}
                aria-label="Story text"
                className="scrollbar-slim h-full w-full resize-none bg-transparent text-sm leading-relaxed text-foreground/90 outline-none"
              />
            ) : (
              <p
                // Stable hook: the revision strip previews the same text, so
                // matching on content alone is ambiguous once a history exists.
                data-slot="story-body"
                className="text-sm leading-relaxed text-foreground/90"
              >
                {activeStory.text}
              </p>
            )}
          </div>

          {editing ? null : (
            <p className="text-xs text-muted-foreground">
              Read-only. Use Edit above to change them.
            </p>
          )}
        </div>
      </div>

      {/* 18px, a step up from anything inside the brief card: this labels a whole
          section beside it rather than a part of it. */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Screenplay</h3>
        <ScreenplayTab />
        {/* Below the scenes, because it acts on them: you read the screenplay, then
            decide to generate. Outlined and full width — it spans the section it
            belongs to, while staying visibly a step short of the filled
            `Generate Final Production` at the bottom of the page. */}
        {/* TODO: the scene-generation API call belongs behind this; for now it only
            flips the flag that reveals the test screening. */}
        <BrandOutlineButton className="w-full" onClick={generateScenes}>
          <Sparkles aria-hidden className="size-4" />
          Generate Scenes
        </BrandOutlineButton>
      </section>

      {/* Nothing to screen until the scenes exist, so the section is absent rather
          than empty — an assembled-cut player and a row of takes standing by with no
          takes to show would read as broken. */}
      {scenesGenerated ? (
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Test Screening</h3>
          <TestScreening />
        </section>
      ) : null}
    </div>
  );
}

/**
 * The model's trade-offs, on demand.
 *
 * This was a permanent card taking a third of the page to say something you only
 * need while choosing. Behind an icon it stays one hover away and stops competing
 * with the prose.
 *
 * The trigger is a real button, not a bare icon: `PreviewCard` opens on focus as
 * well as hover, which is the only way this content is reachable without a mouse.
 */
function ModelDetails({
  model,
  settings,
  previewing,
}: {
  model: string;
  settings: SessionSettings;
  previewing?: boolean;
}) {
  const profile = profileFor(model);
  const rationale = deriveRationale(settings);

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={`About ${model}`}
            data-slot="model-info"
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Info aria-hidden className="size-3.5" />
          </button>
        }
      />
      <HoverCardContent align="end" className="w-72">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {previewing ? "Previewing" : "Selected model"}
        </span>
        <div className="mt-1 flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-brand" />
            {model}
          </p>
          <Meter label="Realism" value={profile.realism} />
        </div>

        <ul className="mt-3 space-y-1.5">
          {rationale.map((line) => (
            <li
              key={line}
              className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <span
                aria-hidden
                className="mt-[6px] size-1 shrink-0 rounded-full bg-current text-brand"
              />
              {line}
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Five ticks, filled to the profile's score. */
function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="shrink-0 text-right">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            aria-hidden
            className={cn(
              "h-1.5 w-3 rounded-full",
              step <= value ? "bg-brand" : "bg-muted",
            )}
          />
        ))}
        <span className="sr-only">{value} out of 5</span>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  Icon,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  Icon: typeof Check;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
        primary
          ? "border-brand/45 bg-brand/15 text-foreground"
          : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
