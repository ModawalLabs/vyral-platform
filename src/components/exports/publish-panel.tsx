"use client";

import { Send } from "lucide-react";
import { useState } from "react";

import { PUBLISH_FORMS, type PublishField } from "@/components/exports/publish-forms";
import { PROVIDER_META } from "@/components/social/provider-marks";
import { BrandButton } from "@/components/ui/brand-button";
import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/types/social";
import { cn } from "@/lib/utils";

/** One field treatment, so a text input and a select are the same object. */
const FIELD = cn(
  "h-9 w-full rounded-lg bg-foreground/[0.03] px-3 text-sm text-foreground",
  "ring-1 ring-foreground/10 transition-colors ring-inset",
  "placeholder:text-muted-foreground/70",
  "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
);

const LABEL =
  "block text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase";

/**
 * Choose a destination, fill its form, publish.
 *
 * One platform at a time. The alternative — every platform toggling independently with
 * its own form stacked below — leaves a single Publish button whose scope is ambiguous;
 * here what the button will do is always exactly what is on screen.
 *
 * Nothing is submitted. The fields are real and typeable so the flow can be walked
 * through, but there is no OAuth and no upload behind them, and Publish says so rather
 * than pretending. Uncontrolled inputs on purpose: with nothing to validate and nothing
 * to submit, holding every keystroke in React state would buy exactly nothing.
 *
 * TODO: on selection, check the provider is actually connected in Settings and offer to
 * link it if not; then submit through a server action.
 */
export function PublishPanel({ videoTitle }: { videoTitle: string }) {
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const form = provider ? PUBLISH_FORMS[provider] : null;

  return (
    <Panel>
      <PanelBevel />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div>
          <PanelLabel>Publish</PanelLabel>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Send this cut straight to a connected account.
          </p>
        </div>

        {/*
          A radio group, not a set of toggles: exactly one destination can be chosen,
          and `radio` is what tells a screen reader that picking one clears the others.
          Arrow keys move between them for free.
        */}
        <div
          role="radiogroup"
          aria-label="Publish destination"
          data-slot="publish-destinations"
          className="grid gap-3 sm:grid-cols-3"
        >
          {SOCIAL_PROVIDERS.map((key) => {
            const { name, Mark, chip, glow } = PROVIDER_META[key];
            const isActive = provider === key;

            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setProvider(isActive ? null : key)}
                className={cn(
                  "group/dest relative isolate flex items-center gap-3 overflow-hidden rounded-xl p-3 text-left transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
                  isActive
                    ? "bg-brand/[0.06] ring-1 ring-brand/45 ring-inset"
                    : "bg-foreground/[0.02] ring-1 ring-foreground/[0.08] ring-inset hover:bg-foreground/[0.05]",
                )}
              >
                {/* The provider's own colour, blurred out of the corner. Same device as
                    the Settings tiles, so the two surfaces read as one product. */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -top-8 -right-8 -z-10 size-20 rounded-full blur-2xl",
                    glow,
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-foreground/[0.06] ring-inset",
                    chip,
                  )}
                >
                  <Mark className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {name}
                </span>
                {/* A filled dot rather than a tick: this is a single choice, and a tick
                    reads as "included" in a list you could add more to. */}
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full transition-colors",
                    isActive ? "bg-brand" : "bg-foreground/15",
                  )}
                />
              </button>
            );
          })}
        </div>

        {form && provider ? (
          // Keyed on the provider so switching destination remounts the fields. Without
          // it, React reuses the inputs by position and a YouTube description would
          // survive into TikTok's caption.
          <form
            key={provider}
            data-slot="publish-form"
            onSubmit={(event) => event.preventDefault()}
            className="flex flex-col gap-4 rounded-xl bg-foreground/[0.02] p-5 ring-1 ring-foreground/[0.06] ring-inset"
          >
            <p className="text-xs text-muted-foreground">{form.blurb}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {form.fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  provider={provider}
                  videoTitle={videoTitle}
                />
              ))}
            </div>

            {/* TODO: submits through a server action once an OAuth provider exists. */}
            <BrandButton
              type="submit"
              title="Publishing is not wired up yet"
              className="self-end"
            >
              <Send aria-hidden className="size-4" />
              Publish to {PROVIDER_META[provider].name}
            </BrandButton>
          </form>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
            Pick a destination to see its options.
          </p>
        )}
      </div>
    </Panel>
  );
}

function Field({
  field,
  provider,
  videoTitle,
}: {
  field: PublishField;
  provider: SocialProvider;
  videoTitle: string;
}) {
  // Namespaced so two platforms' `caption` fields never collide in the DOM, which
  // would break the label-to-input association after a switch.
  const id = `${provider}-${field.name}`;

  if (field.kind === "toggle") {
    return (
      // A real checkbox, visually restyled: `peer` plus `sr-only` keeps the native
      // control — and therefore its keyboard behaviour and announced state — while the
      // span next to it does the drawing.
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2.5 self-end sm:col-span-2"
      >
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={field.defaultOn}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-[5px] ring-1 ring-foreground/20 transition-colors ring-inset",
            "peer-checked:bg-brand peer-checked:ring-brand",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60",
          )}
        >
          <svg
            viewBox="0 0 12 12"
            className="size-2.5 text-brand-foreground opacity-0 peer-checked:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6.5 5 9l4.5-5.5" />
          </svg>
        </span>
        <span className="text-sm">{field.label}</span>
      </label>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0",
        // A textarea and a full-width text field both need the whole row; a select or a
        // short text field sits in half of it.
        (field.kind === "textarea" || (field.kind === "text" && field.wide)) &&
          "sm:col-span-2",
      )}
    >
      <label htmlFor={id} className={LABEL}>
        {field.label}
      </label>

      {field.kind === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          className={cn(
            FIELD,
            "scrollbar-slim mt-1.5 h-auto resize-y py-2 leading-relaxed",
          )}
        />
      ) : field.kind === "select" ? (
        // A native select. The app's Base UI `Select` is unused everywhere else, and a
        // three-option choice gains nothing from a custom popup that has to reimplement
        // typeahead and keyboard handling.
        <select
          id={id}
          name={field.name}
          defaultValue={field.options[0]}
          className={cn(FIELD, "mt-1.5 appearance-none pr-8")}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type="text"
          // YouTube's title starts from the video's own name, which is what someone
          // would type first anyway.
          defaultValue={field.fillWith === "title" ? videoTitle : undefined}
          placeholder={field.placeholder}
          className={cn(FIELD, "mt-1.5")}
        />
      )}
    </div>
  );
}
