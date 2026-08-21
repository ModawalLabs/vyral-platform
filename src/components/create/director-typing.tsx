"use client";

/**
 * The director composing a line.
 *
 * Three dots on staggered pulses. `animate-pulse` on each with its own delay rather
 * than a bespoke keyframe — the effect is the same and it costs no CSS.
 *
 * `role="status"` with real text behind it: a screen reader is told the director is
 * writing, which three animated dots could never convey on their own.
 */
export function DirectorTyping() {
  return (
    <div data-slot="director-typing" className="flex items-center gap-1.5 py-1">
      <span className="sr-only" role="status">
        The director is writing…
      </span>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          aria-hidden
          style={{ animationDelay: `${delay}ms` }}
          className="size-1.5 animate-pulse rounded-full bg-muted-foreground/70"
        />
      ))}
    </div>
  );
}
