"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

import { useComposer } from "@/components/home/composer-provider";
import {
  DEFAULT_SETTINGS,
  type ComposerSettings,
} from "@/components/home/composer-settings";
import { cn } from "@/lib/utils";

/**
 * `useLayoutEffect` is what runs before paint, which is what keeps the height
 * adjustment from being visible as a jump. It warns when React renders on the
 * server, so fall back there — the first render is an empty single line anyway.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Liquid-glass prompt composer, carried over from the landing hero.
 *
 * The landing version hard-codes white-on-black; here every surface comes from
 * a token so the same slab reads correctly in both themes — on a light page the
 * frosted plate is a white veil rather than a dark one.
 *
 * A field and a button, nothing else. The model / duration / aspect pills and the
 * attachment button have been removed from both states: the Production Workspace owns
 * every setting now, and offering them here as well meant two places to change the
 * same thing with only one of them feeding anything downstream.
 */
export function PromptComposer({
  onGenerate,
  initialSettings = DEFAULT_SETTINGS,
  variant = "launcher",
}: {
  /** Called with a non-empty, trimmed prompt and the settings it was written under. */
  onGenerate?: (prompt: string, settings: ComposerSettings) => void;
  /**
   * The settings a submitted prompt is tagged with.
   *
   * Not editable here any more: the composer is a field and a button, and the
   * Production Workspace owns model, platform, ratio, duration and resolution. This
   * is what a session starts on — the defaults, or whatever a handoff URL carried.
   */
  initialSettings?: ComposerSettings;
  /**
   * Which submit affordance to show. `launcher` starts a session and says
   * "Generate"; `chat` adds a turn to one already running and shrinks to an arrow,
   * because by then the button's job is obvious from the conversation above it.
   */
  variant?: "launcher" | "chat";
} = {}) {
  const isChat = variant === "chat";
  const { prompt, setPrompt, consumeAutofillFocus, inputRef } = useComposer();
  /**
   * Drives the glass inset. Deliberately not plain `:focus`: that also fires for the
   * programmatic focus a suggestion card triggers, which is not the user settling in
   * to write.
   */
  const [isWriting, setIsWriting] = useState(false);

  // Grow the field to fit its content. Height has to be cleared first or
  // scrollHeight reports the current (larger) box rather than the text.
  // `max-height` in CSS caps it and turns on the scrollbar past that point.
  useIsomorphicLayoutEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [prompt, inputRef]);

  function submit() {
    const value = prompt.trim();
    if (!value) return;
    // TODO: the generation API call belongs behind this callback.
    onGenerate?.(value, initialSettings);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mx-auto w-full max-w-2xl"
    >
      {/* The glass frame drops its inset while the user is writing, so the
          panel reads as one solid surface; the inner panel's radius opens to
          match at the same moment. */}
      <div
        className={cn(
          "glass-frame group relative overflow-hidden rounded-3xl p-[5px] shadow-2xl shadow-black/15 transition-[padding] duration-300 dark:shadow-black/40",
          isWriting && "p-0",
        )}
      >
        {/* Sheen falling from the top edge gives the slab thickness */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-glass-sheen/40 via-transparent to-transparent"
        />
        {/* Specular highlight along the top bevel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glass-sheen to-transparent"
        />
        {/* Refracted glow pooling in the lower corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-16 size-56 rounded-full bg-brand/20 blur-3xl"
        />

        {/* Inner panel. Radius is the outer 24px minus the 5px inset so the two
            curves stay concentric, and matches the outer radius once the inset
            collapses. */}
        <div
          className={cn(
            "relative flex w-full flex-col rounded-[19px] bg-composer p-3 transition-[border-radius] duration-300",
            isWriting && "rounded-3xl",
          )}
        >
          {/*
            `items-end` so the button stays pinned to the bottom edge as the field
            grows. At one line the field's padding matches its height, so it reads as
            centred until there is a reason not to.

            No focus ring on this row by design — the text caret is itself a
            visible focus indicator, and the frame animation marks the state.
          */}
          <div className="flex items-end gap-2 rounded-xl p-2 pl-4 text-left">
            <label htmlFor="vyral-prompt" className="sr-only">
              Describe your Vyral idea
            </label>
            <textarea
              id="vyral-prompt"
              ref={inputRef}
              rows={1}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onFocus={() => {
                // A card handing over a prompt focuses the field too; that
                // should leave the frame alone.
                if (!consumeAutofillFocus()) setIsWriting(true);
              }}
              onBlur={() => setIsWriting(false)}
              onPointerDown={() => setIsWriting(true)}
              onKeyDown={(event) => {
                setIsWriting(true);
                // Shift+Enter inserts a newline; Enter alone submits.
                // `isComposing` guards IME input, where Enter is confirming a
                // candidate rather than finishing the prompt.
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Describe your Vyral idea, and we will generate your masterpiece"
              // ~5 lines at leading-6 plus the vertical padding, then it scrolls
              // rather than pushing the rest of the page around.
              // `pr-2` keeps the last character clear of the scrollbar track.
              className="scrollbar-slim max-h-[8.25rem] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 pr-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/70"
            />

            {/* Icon-only in `chat` mode, so the label lives in `aria-label` —
                the button still has an accessible name. */}
            <button
              type="submit"
              disabled={!prompt.trim()}
              aria-label={isChat ? "Send" : undefined}
              title={isChat ? "Send" : undefined}
              className={cn(
                "shrink-0 rounded-lg bg-gradient-to-r from-brand to-brand-accent text-sm font-medium text-brand-foreground shadow-lg shadow-brand/30",
                "transition-[filter,box-shadow] hover:shadow-brand/45 hover:brightness-110",
                "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isChat ? "grid size-9 place-items-center" : "h-9 px-4",
              )}
            >
              {isChat ? <ArrowUp aria-hidden className="size-4" /> : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
