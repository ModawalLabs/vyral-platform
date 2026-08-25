"use client";

import {
  ChevronRight,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  AddProjectsDialog,
  NewFolderDialog,
  RenameFolderDialog,
} from "@/components/projects/folder-dialogs";
import { FolderTile, NewFolderTile } from "@/components/projects/folder-tile";
import { ProjectToolbar } from "@/components/projects/library-toolbar";
import { ProjectCard } from "@/components/projects/project-card";
import {
  applyFilters,
  clearFilters,
  DEFAULT_FILTERS,
  type ProjectFilters,
} from "@/components/projects/project-filters";
import { ProjectMenu } from "@/components/projects/project-menu";
import { SelectionBar } from "@/components/projects/selection-bar";
import { BrandLink } from "@/components/ui/brand-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchField } from "@/components/ui/search-field";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { Project, ProjectFolder } from "@/types/project";

/** How many cards get `priority` — roughly the first row above the fold. */
const PRIORITY_CARDS = 5;

let folderCounter = 0;
/** Monotonic rather than random, so ids stay stable under React's strict double-invoke. */
const nextFolderId = () => `f_new_${(folderCounter += 1)}`;

type DialogState =
  | { kind: "new"; seed: ReadonlySet<string> }
  | { kind: "add"; folderId: string }
  | { kind: "rename"; folderId: string }
  | null;

/**
 * The project library: folders, filters, selection and the grid.
 *
 * One client component rather than several, because every one of those four things
 * reads or writes the others — filtering changes what Select all means, opening a
 * folder changes the pool the filters count against, creating a folder can consume the
 * current selection. Split across siblings, all of that state would have had to be
 * lifted here anyway; this way the coupling is visible in one file instead of implied
 * by a chain of props.
 *
 * Folder membership is held in state and nothing is persisted: a reload puts the seeded
 * set back. That is on purpose while this is a UI flow — the point is to be able to walk
 * "create a folder, drop six projects in, filter inside it, take one back out" and judge
 * how it feels, which a set of inert buttons cannot show.
 *
 * Navigating into a folder swaps the view in place rather than routing. A folder made in
 * the browser has no id the server knows, so `/projects/[folderId]` would 404 on the
 * first reload and the flow would only half work. When folders are real, this becomes a
 * route and the state below becomes the fetch.
 */
export function ProjectsLibrary({
  projects,
  folders: seedFolders,
}: {
  projects: Project[];
  folders: ProjectFolder[];
}) {
  const [folders, setFolders] = useState(seedFolders);
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>(null);

  const byId = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const openFolder = folders.find((folder) => folder.id === openFolderId) ?? null;

  /**
   * What the grid is drawn from before filtering.
   *
   * A folder's `projectIds` is the source of order, and ids that no longer resolve are
   * dropped rather than rendered as holes — see the note on `ProjectFolder`.
   */
  const pool = useMemo(() => {
    if (!openFolder) return projects;
    return openFolder.projectIds
      .map((id) => byId.get(id))
      .filter((project): project is Project => project !== undefined);
  }, [openFolder, projects, byId]);

  const visible = useMemo(() => applyFilters(pool, filters), [pool, filters]);

  const isFiltered =
    filters.query.trim() !== "" || filters.status !== "all" || filters.format !== "all";

  // ── Folder mutations ──────────────────────────────────────────────────────

  const createFolder = (name: string, projectIds: string[]) => {
    const folder: ProjectFolder = {
      id: nextFolderId(),
      name,
      projectIds,
      createdAt: new Date().toISOString(),
    };
    // Prepended: the rail is newest-first, and a folder you just made is the one you
    // are about to look for.
    setFolders((current) => [folder, ...current]);
    exitSelectMode();
  };

  const renameFolder = (folderId: string, name: string) =>
    setFolders((current) =>
      current.map((folder) => (folder.id === folderId ? { ...folder, name } : folder)),
    );

  const deleteFolder = (folderId: string) => {
    setFolders((current) => current.filter((folder) => folder.id !== folderId));
    // Deleting the folder you are standing in has to put you somewhere — the library
    // is the only place that always exists.
    if (openFolderId === folderId) leaveFolder();
  };

  const addToFolder = (folderId: string, projectIds: string[]) => {
    setFolders((current) =>
      current.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              // Appended and de-duplicated: adding something twice is a no-op, not a
              // second copy, and the order a folder was filled in is worth keeping.
              projectIds: [
                ...folder.projectIds,
                ...projectIds.filter((id) => !folder.projectIds.includes(id)),
              ],
            }
          : folder,
      ),
    );
    exitSelectMode();
  };

  const removeFromFolder = (folderId: string, projectIds: string[]) => {
    const drop = new Set(projectIds);
    setFolders((current) =>
      current.map((folder) =>
        folder.id === folderId
          ? { ...folder, projectIds: folder.projectIds.filter((id) => !drop.has(id)) }
          : folder,
      ),
    );
    exitSelectMode();
  };

  const toggleProjectInFolder = (folderId: string, projectId: string) => {
    const folder = folders.find((entry) => entry.id === folderId);
    if (!folder) return;
    if (folder.projectIds.includes(projectId)) removeFromFolder(folderId, [projectId]);
    else addToFolder(folderId, [projectId]);
  };

  // ── Navigation and selection ──────────────────────────────────────────────

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  /** Narrowing does not survive a move between views; the chosen order does. */
  function resetView() {
    setFilters((current) => clearFilters(current));
    exitSelectMode();
  }

  const enterFolder = (folderId: string) => {
    setOpenFolderId(folderId);
    resetView();
  };

  function leaveFolder() {
    setOpenFolderId(null);
    resetView();
  }

  const toggleSelected = (projectId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(projectId)) next.add(projectId);
      return next;
    });

  // ── Render ────────────────────────────────────────────────────────────────

  const dialogFolder =
    dialog && dialog.kind !== "new"
      ? (folders.find((folder) => folder.id === dialog.folderId) ?? null)
      : null;

  return (
    <div className="flex flex-col gap-8">
      {/*
        Search sits above everything, outside both the rail and the toolbar.
        It queries the library, not the grid's current contents, so putting it beside
        the status and format pills would have implied it was one more way to narrow
        what is already on screen. Its value is still part of `filters`, so it appears
        in the chip row like any other narrowing.
      */}
      <SearchField
        id={openFolder ? "folder-search" : "project-search"}
        label={openFolder ? `Search in ${openFolder.name}` : "Search projects"}
        placeholder={openFolder ? `Search in ${openFolder.name}` : "Search projects"}
        value={filters.query}
        onValueChange={(query) => setFilters({ ...filters, query })}
        className="sm:max-w-md"
      />

      {openFolder ? (
        <FolderHeader
          folder={openFolder}
          count={pool.length}
          onLeave={leaveFolder}
          onAdd={() => setDialog({ kind: "add", folderId: openFolder.id })}
          onRename={() => setDialog({ kind: "rename", folderId: openFolder.id })}
          onDelete={() => deleteFolder(openFolder.id)}
        />
      ) : (
        <FolderRail
          folders={folders}
          byId={byId}
          onOpen={enterFolder}
          onNew={() => setDialog({ kind: "new", seed: selected })}
          onRename={(folderId) => setDialog({ kind: "rename", folderId })}
          onDelete={deleteFolder}
        />
      )}

      {/*
        This section is the selection bar's sticky containing block, so the room the
        bar needs has to be *here*. Without it the bar parks 24px above the viewport
        floor and lands on top of the last row of captions once you scroll to the end.
      */}
      <section className={cn("flex min-w-0 flex-col gap-4", selectMode && "pb-24")}>
        {/*
          Titled the same way the rail above it is, so the page reads as two labelled
          blocks rather than one labelled block and a loose grid.

          The count lives in the heading rather than on its own line: it is the page's
          only feedback that a filter did anything — narrowing ten cards to eight is
          otherwise invisible — and beside the title is where the rail already puts it.
        */}
        <header className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Projects</h2>
          <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {visible.length} of {pool.length} {pool.length === 1 ? "project" : "projects"}
          </span>
        </header>

        <ProjectToolbar
          filters={filters}
          onFiltersChange={setFilters}
          pool={pool}
          selectMode={selectMode}
          onToggleSelectMode={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          actions={
            openFolder ? null : (
              // New folder is gone from here — the rail's dashed tile already offers it,
              // and two buttons for one action a few hundred pixels apart is the kind of
              // duplication that makes a toolbar feel unconsidered.
              <BrandLink href={routes.newVideo}>
                New video
                <Plus className="size-4" />
              </BrandLink>
            )
          }
        />

        {visible.length === 0 ? (
          <EmptyState
            isFiltered={isFiltered}
            inFolder={openFolder !== null}
            onClearFilters={() => setFilters(clearFilters(filters))}
            onAdd={
              openFolder
                ? () => setDialog({ kind: "add", folderId: openFolder.id })
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                priority={index < PRIORITY_CARDS}
                selectMode={selectMode}
                selected={selected.has(project.id)}
                onToggleSelect={() => toggleSelected(project.id)}
                menu={
                  <ProjectMenu
                    project={project}
                    folders={folders}
                    onToggleFolder={(folderId) =>
                      toggleProjectInFolder(folderId, project.id)
                    }
                    onNewFolder={() =>
                      setDialog({ kind: "new", seed: new Set([project.id]) })
                    }
                    currentFolder={openFolder}
                    onRemoveFromCurrent={
                      openFolder
                        ? () => removeFromFolder(openFolder.id, [project.id])
                        : undefined
                    }
                  />
                }
              />
            ))}
          </div>
        )}

        {selectMode ? (
          <SelectionBar
            count={selected.size}
            total={visible.length}
            folders={folders}
            onAddToFolder={(folderId) => addToFolder(folderId, [...selected])}
            onNewFolder={() => setDialog({ kind: "new", seed: selected })}
            onSelectAll={() => setSelected(new Set(visible.map((p) => p.id)))}
            onClear={exitSelectMode}
            currentFolder={openFolder}
            onRemoveFromCurrent={
              openFolder
                ? () => removeFromFolder(openFolder.id, [...selected])
                : undefined
            }
          />
        ) : null}
      </section>

      <NewFolderDialog
        open={dialog?.kind === "new"}
        onOpenChange={(open) => !open && setDialog(null)}
        projects={projects}
        initialSelection={dialog?.kind === "new" ? dialog.seed : undefined}
        onCreate={createFolder}
      />

      <AddProjectsDialog
        open={dialog?.kind === "add"}
        onOpenChange={(open) => !open && setDialog(null)}
        folder={dialog?.kind === "add" ? dialogFolder : null}
        projects={projects}
        onAdd={addToFolder}
      />

      <RenameFolderDialog
        open={dialog?.kind === "rename"}
        onOpenChange={(open) => !open && setDialog(null)}
        folder={dialog?.kind === "rename" ? dialogFolder : null}
        onRename={renameFolder}
      />
    </div>
  );
}

/**
 * The folder rail.
 *
 * Above the grid rather than in a left column: the page is a wall of thumbnails, and a
 * persistent sidebar would take a third of the width away from the thing people came to
 * look at. A row costs one band of height and is gone once you are inside a folder.
 */
function FolderRail({
  folders,
  byId,
  onOpen,
  onNew,
  onRename,
  onDelete,
}: {
  folders: ProjectFolder[];
  byId: Map<string, Project>;
  onOpen: (folderId: string) => void;
  onNew: () => void;
  onRename: (folderId: string) => void;
  onDelete: (folderId: string) => void;
}) {
  return (
    <section className="min-w-0">
      <header className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Folders</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {folders.length}
        </span>
      </header>

      {/* Four across at xl, so the New folder tile shares the row with the folders
          rather than starting a second one under a mostly-empty band. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {folders.map((folder) => (
          <FolderTile
            key={folder.id}
            folder={folder}
            projects={folder.projectIds
              .map((id) => byId.get(id))
              .filter((project): project is Project => project !== undefined)}
            onOpen={() => onOpen(folder.id)}
            onRename={() => onRename(folder.id)}
            onDelete={() => onDelete(folder.id)}
          />
        ))}

        <NewFolderTile onClick={onNew} />
      </div>
    </section>
  );
}

/** Where you are, how to get out, and what can be done to the folder itself. */
function FolderHeader({
  folder,
  count,
  onLeave,
  onAdd,
  onRename,
  onDelete,
}: {
  folder: ProjectFolder;
  count: number;
  onLeave: () => void;
  onAdd: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      {/* A real breadcrumb, not just a back arrow: the arrow says "somewhere else",
          the crumb says where. */}
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          <li>
            <button
              type="button"
              onClick={onLeave}
              className="rounded px-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              All projects
            </button>
          </li>
          <li aria-hidden className="text-muted-foreground/50">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="min-w-0">
            <h2
              aria-current="page"
              className="flex min-w-0 items-center gap-2 truncate font-semibold tracking-tight"
            >
              <FolderOpen aria-hidden className="size-4 shrink-0 text-brand-text" />
              <span className="truncate">{folder.name}</span>
            </h2>
          </li>
        </ol>
      </nav>

      <span className="text-xs text-muted-foreground tabular-nums">
        {count} {count === 1 ? "project" : "projects"}
      </span>

      {/* Same wrap as the toolbar below it — see the note there. */}
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand/45 bg-brand/10 px-3.5 text-sm font-medium text-brand-text transition-colors hover:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
        >
          <Plus aria-hidden className="size-4" />
          Add projects
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`More options for ${folder.name}`}
            className={cn(
              "grid size-10 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          >
            <MoreHorizontal aria-hidden className="size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-auto min-w-40">
            <DropdownMenuItem onClick={onRename}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * Three different nothings.
 *
 * "No results" and "nothing here yet" are not the same message, and the difference is
 * the only thing that tells you whether to change a filter or make a video.
 */
function EmptyState({
  isFiltered,
  inFolder,
  onClearFilters,
  onAdd,
}: {
  isFiltered: boolean;
  inFolder: boolean;
  onClearFilters: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-sm font-medium">
        {isFiltered
          ? "No projects match these filters"
          : inFolder
            ? "This folder is empty"
            : "No projects yet"}
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        {isFiltered
          ? "Try widening the status or format, or clearing the search."
          : inFolder
            ? "Add projects from your library — nothing is moved or copied."
            : "Start with New video and everything you generate lands here."}
      </p>

      {isFiltered ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-1 inline-flex h-9 items-center rounded-xl border border-border bg-background px-3.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Clear filters
        </button>
      ) : inFolder && onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 inline-flex h-9 items-center gap-2 rounded-xl border border-brand/45 bg-brand/10 px-3.5 text-sm font-medium text-brand-text transition-colors hover:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:outline-none"
        >
          <Plus aria-hidden className="size-4" />
          Add projects
        </button>
      ) : (
        <BrandLink href={routes.newVideo} className="mt-1 h-9">
          New video
          <Plus className="size-4" />
        </BrandLink>
      )}
    </div>
  );
}
