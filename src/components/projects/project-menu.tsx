"use client";

import { Check, FolderMinus, FolderPlus, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Project, ProjectFolder } from "@/types/project";

/**
 * The per-card overflow menu.
 *
 * Filing one project should not require entering select mode, so this is the single
 * counterpart to the bulk bar: same destinations, one project. Folders the project is
 * already in are shown ticked rather than hidden — the menu doubles as the answer to
 * "where does this live?", which nothing else on the card says.
 *
 * Toggling a ticked folder removes it, so the same row both files and unfiles.
 */
export function ProjectMenu({
  project,
  folders,
  onToggleFolder,
  onNewFolder,
  /** Set when the menu is opened from inside a folder, which gets its own direct action. */
  currentFolder,
  onRemoveFromCurrent,
}: {
  project: Project;
  folders: readonly ProjectFolder[];
  onToggleFolder: (folderId: string) => void;
  onNewFolder: () => void;
  currentFolder?: ProjectFolder | null;
  onRemoveFromCurrent?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More options for ${project.title}`}
        title="More options"
        className={cn(
          "grid size-9 place-items-center rounded-full text-white",
          "bg-white/15 ring-1 ring-white/25 backdrop-blur-md transition-colors",
          "hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none",
        )}
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </DropdownMenuTrigger>

      {/* `w-auto` beats the primitive's `w-(--anchor-width)`, which would size the
          menu to the 36px disc it hangs off. */}
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        {currentFolder && onRemoveFromCurrent ? (
          <>
            <DropdownMenuItem onClick={onRemoveFromCurrent}>
              <FolderMinus />
              Remove from “{currentFolder.name}”
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderPlus />
            Add to folder
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-auto min-w-48">
            {folders.length === 0 ? (
              <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
            ) : (
              folders.map((folder) => {
                const inFolder = folder.projectIds.includes(project.id);
                return (
                  <DropdownMenuItem
                    key={folder.id}
                    // `closeOnClick={false}` would let several folders be ticked in one
                    // pass, but it also leaves the menu sitting over the card with no
                    // obvious way out. Filing into several folders at once is what the
                    // bulk bar is for.
                    onClick={() => onToggleFolder(folder.id)}
                  >
                    <Check className={cn(inFolder ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  </DropdownMenuItem>
                );
              })
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewFolder}>
              <FolderPlus />
              New folder…
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
