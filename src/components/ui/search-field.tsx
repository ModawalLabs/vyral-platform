import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Labelled search input with a leading icon.
 *
 * Works both ways. Left alone it is an uncontrolled shell, which is all the Templates
 * page needs until there is data worth querying. Handed `value` and `onValueChange` it
 * becomes controlled and grows a clear button — that is the mode the project library
 * uses, where the query is one of several filters and something else on the page has
 * to be able to reset it.
 *
 * The clear button is tied to controlled mode on purpose: an uncontrolled field has no
 * state this component could clear.
 */
export function SearchField({
  id,
  label,
  placeholder,
  className,
  value,
  onValueChange,
}: {
  id: string;
  /** Visually hidden — the icon alone is not an accessible name. */
  label: string;
  placeholder: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const controlled = value !== undefined && onValueChange !== undefined;
  const showClear = controlled && value !== "";

  return (
    <div className={cn("relative min-w-0 flex-1 sm:max-w-sm", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        type="search"
        placeholder={placeholder}
        className={cn("h-10 rounded-xl pl-9", showClear && "pr-9")}
        {...(controlled
          ? { value, onChange: (event) => onValueChange(event.target.value) }
          : {})}
      />

      {showClear ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
