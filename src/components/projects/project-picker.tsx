"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { matchesQuery } from "@/components/projects/project-filters";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Project } from "@/types/project";

/**
 * A tickable list of projects, for pointing a folder at things that already exist.
 *
 * Used twice — while creating a folder and while adding to one — so the two flows
 * cannot drift into looking like different features. It owns nothing but its own
 * search box; the ticks live with whoever is going to act on them.
 *
 * Rows carry a thumbnail because the titles are the least distinctive thing about a
 * video library: "Rooftop timelapse" and "Cliffside drone pull" are both just words
 * until you see them.
 */
export function ProjectPicker({
  projects,
  selected,
  onToggle,
  /** Ids already in the folder — shown, ticked and locked rather than hidden. */
  alreadyIn,
  emptyMessage = "Nothing to add.",
}: {
  projects: readonly Project[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  alreadyIn?: ReadonlySet<string>;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => projects.filter((project) => matchesQuery(project, query)),
    [projects, query],
  );

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter projects"
          aria-label="Filter projects"
          className="h-9 w-full rounded-lg border border-border bg-background pr-2.5 pl-8 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        />
      </div>

      {/*
        A fixed-height scroller, not a list that grows the dialog. The library has no
        ceiling, and a dialog that resizes as you type is a dialog whose primary button
        moves out from under the pointer.
      */}
      <div
        role="group"
        aria-label="Projects"
        className="h-64 overflow-y-auto rounded-xl border border-border/70 bg-muted/30 p-1"
      >
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {query.trim() === "" ? emptyMessage : `No project matches “${query.trim()}”.`}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {visible.map((project) => {
              const locked = alreadyIn?.has(project.id) ?? false;
              const ticked = locked || selected.has(project.id);

              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(project.id)}
                    disabled={locked}
                    role="checkbox"
                    aria-checked={ticked}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors",
                      "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                      // Locked rows stay readable rather than greyed to nothing: they
                      // are the answer to "why is this not in the list?".
                      locked && "cursor-default opacity-60 hover:bg-transparent",
                      ticked && !locked && "bg-brand/[0.07]",
                    )}
                  >
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md ring-1 ring-border/60">
                      <ProjectThumbnail
                        project={project}
                        sizes="36px"
                        iconClassName="size-4"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{project.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {locked
                          ? "Already in folder"
                          : formatRelativeTime(project.createdAt)}
                      </span>
                    </span>

                    {/* A drawn box rather than a native checkbox: the row is the hit
                        target, and a real input inside a button would be a second one. */}
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                        ticked
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border",
                      )}
                    >
                      {ticked ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
