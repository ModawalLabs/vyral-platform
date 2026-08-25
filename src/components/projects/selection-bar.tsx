"use client";

import { Check, FolderMinus, FolderPlus, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectFolder } from "@/types/project";

/**
 * What select mode is for: a bar that appears with the first tick and says what can be
 * done with the set.
 *
 * `sticky bottom-6` rather than `fixed`, so it rides above the grid while you scroll
 * but stays centred on the *content* column — the workspace has a 256px sidebar, and a
 * viewport-fixed bar would sit visibly off-centre from everything it acts on. As the
 * last child in flow it also lands neatly at the end when the grid is short enough not
 * to scroll at all.
 *
 * The count is the first thing in the bar because it is the only thing that answers
 * "what am I about to do this to".
 */
export function SelectionBar({
  count,
  total,
  folders,
  onAddToFolder,
  onNewFolder,
  onSelectAll,
  onClear,
  currentFolder,
  onRemoveFromCurrent,
}: {
  count: number;
  /** How many are on screen, so Select all can say whether it would change anything. */
  total: number;
  folders: readonly ProjectFolder[];
  onAddToFolder: (folderId: string) => void;
  onNewFolder: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  currentFolder?: ProjectFolder | null;
  onRemoveFromCurrent?: () => void;
}) {
  const allSelected = count > 0 && count === total;

  return (
    <div className="sticky bottom-6 z-30 flex justify-center pt-2">
      <div
        data-slot="selection-bar"
        role="status"
        className={cn(
          "flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2",
          "border border-border/70 bg-popover/95 shadow-xl shadow-black/20 backdrop-blur-md",
          "animate-in duration-200 fade-in-0 slide-in-from-bottom-2",
        )}
      >
        <span className="px-1.5 text-sm font-medium tabular-nums">{count} selected</span>

        <span aria-hidden className="h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={count === 0}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand/45 bg-brand/10 px-3 text-sm font-medium text-brand-text",
              "transition-colors hover:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <FolderPlus aria-hidden className="size-4" />
            Add to folder
          </DropdownMenuTrigger>

          <DropdownMenuContent align="center" side="top" className="w-auto min-w-48">
            {folders.length === 0 ? (
              <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
            ) : (
              folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onAddToFolder(folder.id)}
                >
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {folder.projectIds.length}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewFolder}>
              <FolderPlus />
              New folder…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentFolder && onRemoveFromCurrent ? (
          <button
            type="button"
            onClick={onRemoveFromCurrent}
            disabled={count === 0}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium",
              "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <FolderMinus aria-hidden className="size-4" />
            Remove from folder
          </button>
        ) : null}

        <button
          type="button"
          onClick={onSelectAll}
          disabled={allSelected || total === 0}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <Check aria-hidden className="size-4" />
          Select all
        </button>

        {/* Exits select mode as well as clearing the ticks — with nothing selected the
            mode has no purpose, and leaving it armed means the next click on a card
            still does not do what it looks like it does. */}
        <button
          type="button"
          onClick={onClear}
          aria-label="Cancel selection"
          className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
