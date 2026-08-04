import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Labelled search input with a leading icon.
 *
 * Stateless on purpose — the library pages render it as a shell until there is
 * data worth querying. Wiring it up means either lifting the parent toolbar to
 * a client component that filters, or making this a form that writes `?q=` and
 * letting the page re-fetch. The markup is the same either way.
 */
export function SearchField({
  id,
  label,
  placeholder,
  className,
}: {
  id: string;
  /** Visually hidden — the icon alone is not an accessible name. */
  label: string;
  placeholder: string;
  className?: string;
}) {
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
        className="h-10 rounded-xl pl-9"
      />
    </div>
  );
}
