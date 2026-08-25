"use client";

import {
  ChevronRight,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Project, ProjectFolder } from "@/types/project";

/** How many cells the mosaic shows before it stops counting. */
const MOSAIC_CELLS = 4;

/**
 * One folder in the rail.
 *
 * A mosaic of what is inside rather than a folder glyph, because the whole page is
 * pictures and a row of identical icons would be the only place you could not tell
 * two things apart at a glance. Four cells is the most that stays legible at this
 * size; a fifth project is implied by the count, not drawn.
 *
 * The whole tile is the open control — a `<button>` rather than a card with a link
 * buried in it, so the target is the thing you are looking at. The overflow menu sits
 * *outside* that button in the DOM for the same reason a nested button is invalid:
 * one cannot contain the other, so they are siblings inside a positioned wrapper.
 */
export function FolderTile({
  folder,
  projects,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: ProjectFolder;
  /** The folder's members, already resolved against the library. */
  projects: Project[];
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const cells = projects.slice(0, MOSAIC_CELLS);
  const count = projects.length;

  return (
    <div
      data-slot="folder-tile"
      data-folder={folder.id}
      className="group relative min-w-0"
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left",
          "transition-[transform,border-color,box-shadow] duration-300",
          "hover:-translate-y-0.5 hover:border-brand/45",
          "hover:shadow-[0_14px_32px_-20px_color-mix(in_oklab,var(--brand)_70%,transparent)]",
          "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
        )}
      >
        {/* The mosaic. Always a 2×2 box whatever the folder holds, so a row of tiles
            lines up — short folders pad with empty cells rather than shrinking. */}
        <span
          aria-hidden
          className="grid size-12 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-xl bg-border/60 ring-1 ring-border/70"
        >
          {count === 0 ? (
            <span className="col-span-2 row-span-2 grid place-items-center bg-muted">
              <Folder className="size-5 text-muted-foreground/50" />
            </span>
          ) : (
            Array.from({ length: MOSAIC_CELLS }, (_, index) => {
              const project = cells[index];
              return (
                <span key={index} className="relative overflow-hidden bg-muted">
                  {project ? (
                    <ProjectThumbnail
                      project={project}
                      sizes="24px"
                      iconClassName="size-3"
                    />
                  ) : null}
                </span>
              );
            })
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{folder.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
            {count} {count === 1 ? "project" : "projects"}
          </span>
        </span>

        {/* Padded right so the chevron never lands under the menu button that sits
            over this same corner. */}
        <ChevronRight
          aria-hidden
          className="mr-7 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More options for ${folder.name}`}
          className={cn(
            "absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground",
            // Quiet until wanted. `focus-visible` and `aria-expanded` keep it reachable
            // by keyboard and visible while its own menu is open.
            "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100",
            "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </DropdownMenuTrigger>

        {/* `w-auto` beats the primitive's `w-(--anchor-width)`, which would otherwise
            size this menu to the 28px trigger. */}
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          <DropdownMenuItem onClick={onRename}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Deleting a folder never touches the projects inside it — see the note on
              `ProjectFolder`. The label says so rather than assuming it is obvious. */}
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** The tile that makes a folder, sitting at the end of the rail. */
export function NewFolderTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-slot="new-folder-tile"
      className={cn(
        "flex min-h-[4.5rem] w-full min-w-0 items-center gap-3 rounded-2xl border border-dashed border-border p-3 text-left",
        "text-muted-foreground transition-colors",
        "hover:border-brand/45 hover:bg-brand/[0.04] hover:text-brand-text",
        "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
      )}
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-xl border border-dashed border-current/40"
      >
        <FolderPlus className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">New folder</span>
        <span className="mt-0.5 block text-xs opacity-70">Group projects together</span>
      </span>
    </button>
  );
}
