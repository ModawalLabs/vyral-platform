"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { FilterOption } from "@/components/projects/project-filters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * One filter control: a pill that names the field, and a popover of choices.
 *
 * Built on `Popover` rather than the `Select` primitive because the pill has to do
 * three things a select trigger does not — read as "Status" when nothing is chosen
 * and "Status · Failed" when something is, light up in the brand colour while it is
 * narrowing the grid, and carry a result count against each option. The last of
 * those is the reason the control is worth the file: picking a filter that turns out
 * to match nothing is the single most annoying thing a filter bar does, and a count
 * beside each row means you never do it by accident.
 *
 * Single-select. The three filters compose with each other but each is one choice,
 * so an option row is a radio, not a checkbox — hence `role="menuitemradio"` and the
 * tick rather than a box.
 */
export function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  countFor,
  /** The value that means "not narrowing" — the pill stays quiet while it is set. */
  neutralValue,
  align = "start",
}: {
  label: string;
  value: T;
  options: readonly FilterOption<T>[];
  onChange: (value: T) => void;
  countFor?: (value: T) => number;
  neutralValue?: T;
  align?: "start" | "end";
}) {
  // Controlled purely so a choice can dismiss the popover. A filter is a one-shot
  // decision — leaving the menu open after a pick would hide the grid it just
  // changed, which is the one thing you want to see.
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);
  const isNarrowing = neutralValue !== undefined && value !== neutralValue;
  const SelectedIcon = selected?.Icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="filter-menu-trigger"
        data-field={label.toLowerCase()}
        data-active={isNarrowing ? "" : undefined}
        // The accessible name carries both halves. "Status" alone would leave a
        // screen-reader user with no idea what it is currently set to, and the
        // visible value beside it is decorative to them.
        aria-label={`${label}: ${selected?.label ?? value}`}
        className={cn(
          "group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm whitespace-nowrap transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          isNarrowing
            ? // Narrowing is a state the page is *in*, so it has to be visible from
              // across the toolbar rather than only on the label you happen to read.
              "border border-brand/45 bg-brand/10 font-medium text-brand-text hover:border-brand/70"
            : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        )}
      >
        {SelectedIcon ? <SelectedIcon aria-hidden className="size-4" /> : null}
        <span aria-hidden>
          {label}
          {isNarrowing ? (
            <>
              <span className="mx-1 opacity-40">·</span>
              {selected?.label}
            </>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className="size-3.5 opacity-60 transition-transform group-aria-expanded:rotate-180"
        />
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-56 gap-0.5 p-1.5"
        // A menu of radios, not a dialog. Base UI's popup is generic, so the role
        // has to be stated for the option rows below to mean anything.
        role="menu"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const count = countFor?.(option.value);

          return (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={isSelected}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                // A choice that would empty the grid stays pickable, only dimmed. Disabling
                // it looks tidier right up until a query narrows every option to zero and
                // the menu becomes a dead end with no way back out.
                count === 0 && "opacity-45",
                isSelected && "font-medium text-brand-text",
              )}
            >
              <option.Icon aria-hidden className="size-4 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>

              {count === undefined ? null : (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              )}

              {/* Always in the layout, only inked when selected — otherwise the
                  labels shift sideways as the tick moves between rows. */}
              <Check
                aria-hidden
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
