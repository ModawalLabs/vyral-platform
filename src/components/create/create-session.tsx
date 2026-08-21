"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DirectorColumn } from "@/components/create/director-column";
import { SessionProvider } from "@/components/create/session-provider";
import { WorkspaceSide } from "@/components/create/workspace-side";
import { useComposer } from "@/components/home/composer-provider";
import {
  parseSettings,
  type ComposerSettings,
} from "@/components/home/composer-settings";
import { GlassWordmark } from "@/components/home/glass-wordmark";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { PromptComposer } from "@/components/home/prompt-composer";
import { Typewriter } from "@/components/ui/typewriter";
import { CURRENT_USER } from "@/config/current-user";
import { DEFAULT_RESOLUTION } from "@/types/session";
import { cn } from "@/lib/utils";

type Session = { prompt: string; settings: ComposerSettings };

/** Raw query values from `/new?prompt=…`, straight off the URL and unvalidated. */
export type Handoff = {
  prompt?: string;
  model?: string;
  duration?: string;
  aspect?: string;
};

/** Long and heavily eased — the composer is travelling a long way. */
const TRAVEL = "700ms";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * The `/new` screen, in its two states.
 *
 * Idle it is a centred composer under the wordmark. Once a prompt is submitted
 * it becomes two columns, with the composer settling into the bottom of the
 * left one.
 *
 * The composer is **absolutely positioned in both states and never re-created**
 * — only its `left` / `bottom` / `width` change. That is the whole trick: moving
 * it between DOM parents would remount it, losing both the animation and
 * whatever the user had typed. For the same reason the geometry is set through
 * inline styles rather than utility classes, so exactly one transition runs on
 * exactly the four properties that change.
 */
export function CreateSession({ handoff }: { handoff?: Handoff }) {
  const { setPrompt } = useComposer();
  const [session, setSession] = useState<Session | null>(null);
  const started = session !== null;

  const initialSettings = useMemo(() => parseSettings(handoff ?? {}), [handoff]);
  const handoffPrompt = handoff?.prompt?.trim();

  const start = useCallback(
    (prompt: string, settings: ComposerSettings) => {
      setSession({ prompt, settings });
      // The prompt is now a sent message; leaving a copy in the field would
      // read as unsent, and the next instruction starts from empty anyway.
      setPrompt("");
    },
    [setPrompt],
  );

  /**
   * A session handed over from the home page.
   *
   * It starts on a timer rather than immediately so the screen paints in its
   * idle state first — the composer lands exactly where it sat on the previous
   * page, then travels. Without the beat there is nothing to animate from and
   * the composer appears to jump across the navigation.
   */
  useEffect(() => {
    if (!handoffPrompt) return;
    const timer = window.setTimeout(() => start(handoffPrompt, initialSettings), 140);
    return () => window.clearTimeout(timer);
  }, [handoffPrompt, initialSettings, start]);

  /**
   * Publish the composer's height as `--composer-h` on the root.
   *
   * The composer is absolutely positioned, so it contributes nothing to layout and
   * the director column has no way to know how much room to leave for it. Measuring
   * rather than hard-coding a reserve matters because the field grows as you type —
   * a fixed reserve sized for five lines would leave a hole under a one-line box.
   *
   * A `ResizeObserver`, not a resize listener: the height changes when the textarea
   * grows, which no window event reports.
   */
  const rootRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const composer = composerRef.current;
    if (!root || !composer) return;

    const publish = () =>
      root.style.setProperty("--composer-h", `${composer.offsetHeight}px`);

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative isolate min-h-dvh overflow-hidden">
      <HeroBackdrop fadeDoodles={false} dimmed={started} />

      {/* Idle hero. Fades up and out; `aria-hidden` once gone so a screen
          reader is not walked through a greeting that is no longer on screen. */}
      <div
        aria-hidden={started}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-[calc(50%-6rem)] px-6 text-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
          started
            ? "-translate-y-[calc(50%+2.5rem)] opacity-0"
            : "-translate-y-1/2 opacity-100",
        )}
      >
        <h1 className="text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.95] font-bold tracking-tight">
          <GlassWordmark>Vyral</GlassWordmark>
        </h1>
        <p className="mt-8 text-xl text-pretty text-muted-foreground sm:text-2xl">
          <Typewriter text={`Hello ${CURRENT_USER.firstName}, Ready to get creative?`} />
        </p>
      </div>

      {/* Split view. Delayed so the columns resolve as the composer lands
          rather than racing it. */}
      <div
        aria-hidden={!started}
        className={cn(
          "absolute inset-0 flex transition-opacity duration-500 ease-out motion-reduce:transition-none",
          started ? "opacity-100 delay-200" : "pointer-events-none opacity-0",
        )}
      >
        {/* Mounted only once a session exists, so the provider's timers and
            seeded chat do not start behind an invisible panel. */}
        {session ? (
          <SessionProvider
            prompt={session.prompt}
            settings={{
              ...session.settings,
              // Neither travels in the handoff URL: the composer has no control for
              // them, so the session picks its own starting point.
              platform: "Instagram Reel",
              resolution: DEFAULT_RESOLUTION,
            }}
          >
            <section className="flex w-[38%] min-w-0 flex-col px-6">
              <DirectorColumn />
            </section>

            {/* Divider draws itself down the middle as the columns arrive. */}
            <div
              aria-hidden
              className={cn(
                "w-px shrink-0 origin-center bg-border transition-transform duration-500 ease-out motion-reduce:transition-none",
                started ? "scale-y-100 delay-200" : "scale-y-0",
              )}
            />

            {/* No heading: the first tab is now called "Production Workspace", so a
                heading above it would have said the same thing twice. `pt-2` plus
                the panel's own `pt-4` lands the tab row on the same baseline as the
                AI Director heading opposite.

                `WorkspaceSide` decides whether that is the workspace yet — until the
                director's intake is answered it is the production slate instead. */}
            <section className="flex min-w-0 flex-1 flex-col px-6 pt-2">
              <WorkspaceSide />
            </section>
          </SessionProvider>
        ) : null}
      </div>

      {/* The composer. One element, two positions. */}
      <div
        ref={composerRef}
        data-slot="composer-travel"
        className="absolute z-20 motion-reduce:transition-none"
        style={{
          transitionProperty: "left, bottom, width, transform",
          transitionDuration: TRAVEL,
          transitionTimingFunction: EASE,
          ...(started
            ? {
                left: "1.5rem",
                bottom: "1.5rem",
                width: "calc(38% - 3rem)",
                transform: "none",
              }
            : {
                left: "50%",
                bottom: "50%",
                width: "min(42rem, calc(100% - 3rem))",
                // Half its own height back down, then clear of the greeting.
                transform: "translate(-50%, calc(50% + 3.5rem))",
              }),
        }}
      >
        <PromptComposer
          onGenerate={start}
          initialSettings={initialSettings}
          // Once the session is running the composer is a chat box, not a
          // launcher: the pills and attachment button fold away and the arrow
          // says "send this turn".
          variant={started ? "chat" : "launcher"}
        />
      </div>
    </div>
  );
}
