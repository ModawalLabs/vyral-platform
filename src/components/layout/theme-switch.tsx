"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * One button that flips the theme.
 *
 * A single control rather than the two-option segmented switch this replaced: with only
 * two themes, a segmented control's non-selected half is the only thing anyone would
 * ever press.
 *
 * **Icon and label both name the destination**, not the current state. A moon captioned
 * "Dark mode" while you are in light mode reads as "press for dark"; a sun captioned
 * "Light mode" would read as a status indicator that happens to be clickable. Only one
 * of those tells you what the button does.
 *
 * Both are swapped by CSS (`dark:`) rather than by the resolved theme. `resolvedTheme` is
 * undefined until hydration, so anything driven by it would paint a guess and correct it
 * — and the theme provider has already written the class onto `<html>` before first
 * paint, so the CSS answer is right from the start. That is also why the *label* is real
 * text in the DOM rather than an `aria-label`: the hidden half is `display: none`, so the
 * accessible name is whichever half is showing, with no JS involved.
 *
 * The collapsed sidebar has no room for the label, so there it falls back to an
 * `aria-label` — the one case that does need the resolved value.
 */
export function ThemeSwitch({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const next = mounted ? (resolvedTheme === "dark" ? "light" : "dark") : undefined;

  return (
    <button
      type="button"
      // `resolvedTheme` is undefined until mount, so before then this reads the DOM the
      // theme provider has already written — no flash, and no wrong click.
      onClick={() =>
        setTheme(
          next ??
            (document.documentElement.classList.contains("dark") ? "light" : "dark"),
        )
      }
      // Only when there is no visible label to name the button.
      aria-label={
        collapsed ? (next ? `Switch to ${next} theme` : "Switch theme") : undefined
      }
      title={collapsed ? (next ? `Switch to ${next} theme` : "Switch theme") : undefined}
      data-slot="theme-toggle"
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        // The same geometry as the Settings row below it, so the footer keeps one rhythm
        // and the icons share a column.
        collapsed ? "size-10 shrink-0 justify-center" : "h-10 px-3",
      )}
    >
      {/* Sized to match the nav icons exactly; `shrink-0` so a long label cannot squeeze
          the glyph. */}
      <Moon aria-hidden className="size-[18px] shrink-0 dark:hidden" />
      <Sun aria-hidden className="hidden size-[18px] shrink-0 dark:block" />

      {collapsed ? null : (
        <>
          <span className="truncate dark:hidden">Dark mode</span>
          <span className="hidden truncate dark:block">Light mode</span>
        </>
      )}
    </button>
  );
}
