"use client";

import { type FormEvent, useState } from "react";

import { ProjectPicker } from "@/components/projects/project-picker";
import { brandButtonClass } from "@/components/ui/brand-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Project, ProjectFolder } from "@/types/project";

/**
 * The three folder dialogs.
 *
 * Kept in one file because they share a shape — a `<form>` whose submit is the primary
 * action — and because splitting them would hide that the create and add flows use the
 * *same* picker. Two pickers that looked slightly different would be the obvious way to
 * make folders feel improvised.
 *
 * Each dialog is a thin shell around an inner form that holds the draft. That split is
 * load-bearing: `Dialog.Portal` renders nothing while closed (`keepMounted` defaults to
 * false, and `mounted` stays true for the duration of the exit animation), so the inner
 * form mounts fresh on every open. Its `useState` initialisers *are* the reset — no
 * effect has to watch `open` and wipe the fields, and a cancelled attempt cannot leak
 * into the next one.
 */

/** Cancel, styled to sit beside the brand primary without competing. */
function CancelButton() {
  return (
    <DialogClose
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium",
        "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      Cancel
    </DialogClose>
  );
}

function SubmitButton({
  disabled,
  children,
}: {
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        brandButtonClass,
        "justify-center disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function NameField({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Folder name
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Client work"
        maxLength={60}
        // The one field that must be filled, so it takes focus on open. Everything
        // else in the dialog is optional.
        autoFocus
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      />
    </div>
  );
}

/** Add or drop one id. Shared by both pickers so they cannot behave differently. */
function toggle(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(current);
  if (!next.delete(id)) next.add(id);
  return next;
}

/**
 * Create a folder, optionally filling it in the same step.
 *
 * Naming and filling are one dialog rather than two because an empty folder is not
 * something anyone wants — it is a step on the way to a full one. The picker is still
 * optional: a folder you intend to drop things into later is a legitimate thing to make.
 */
export function NewFolderDialog({
  open,
  onOpenChange,
  projects,
  onCreate,
  /** Pre-ticked when the dialog is opened from a selection on the grid. */
  initialSelection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: readonly Project[];
  onCreate: (name: string, projectIds: string[]) => void;
  initialSelection?: ReadonlySet<string>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <NewFolderForm
          projects={projects}
          initialSelection={initialSelection}
          onCreate={onCreate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewFolderForm({
  projects,
  initialSelection,
  onCreate,
  onDone,
}: {
  projects: readonly Project[];
  initialSelection?: ReadonlySet<string>;
  onCreate: (name: string, projectIds: string[]) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    () => new Set(initialSelection ?? []),
  );

  const trimmed = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed === "") return;
    onCreate(trimmed, [...picked]);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New folder</DialogTitle>
        <DialogDescription>
          Folders group projects for you — nothing is moved or copied, and a project can
          sit in more than one.
        </DialogDescription>
      </DialogHeader>

      <NameField id="new-folder-name" value={name} onChange={setName} />

      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground">
          Add projects
          <span className="tabular-nums">
            {picked.size === 0 ? "Optional" : `${picked.size} selected`}
          </span>
        </span>
        <ProjectPicker
          projects={projects}
          selected={picked}
          onToggle={(id) => setPicked((current) => toggle(current, id))}
          emptyMessage="No projects yet."
        />
      </div>

      <DialogFooter className="sm:justify-end">
        <CancelButton />
        <SubmitButton disabled={trimmed === ""}>Create folder</SubmitButton>
      </DialogFooter>
    </form>
  );
}

/** Add more projects to a folder that already exists. */
export function AddProjectsDialog({
  open,
  onOpenChange,
  folder,
  projects,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ProjectFolder | null;
  projects: readonly Project[];
  onAdd: (folderId: string, projectIds: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {folder ? (
          <AddProjectsForm
            folder={folder}
            projects={projects}
            onAdd={onAdd}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddProjectsForm({
  folder,
  projects,
  onAdd,
  onDone,
}: {
  folder: ProjectFolder;
  projects: readonly Project[];
  onAdd: (folderId: string, projectIds: string[]) => void;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const alreadyIn = new Set(folder.projectIds);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (picked.size === 0) return;
    onAdd(folder.id, [...picked]);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Add to “{folder.name}”</DialogTitle>
        <DialogDescription>
          Pick the projects to file here. Ones already in the folder are ticked and
          locked.
        </DialogDescription>
      </DialogHeader>

      <ProjectPicker
        projects={projects}
        selected={picked}
        alreadyIn={alreadyIn}
        onToggle={(id) => setPicked((current) => toggle(current, id))}
        emptyMessage="Every project is already in this folder."
      />

      <DialogFooter className="sm:justify-end">
        <CancelButton />
        <SubmitButton disabled={picked.size === 0}>
          {picked.size === 0
            ? "Add to folder"
            : `Add ${picked.size} ${picked.size === 1 ? "project" : "projects"}`}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

/** Rename. Name only — membership is edited from the folder itself. */
export function RenameFolderDialog({
  open,
  onOpenChange,
  folder,
  onRename,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: ProjectFolder | null;
  onRename: (folderId: string, name: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {folder ? (
          <RenameFolderForm
            folder={folder}
            onRename={onRename}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderForm({
  folder,
  onRename,
  onDone,
}: {
  folder: ProjectFolder;
  onRename: (folderId: string, name: string) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(folder.name);
  const trimmed = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed === "") return;
    onRename(folder.id, trimmed);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Rename folder</DialogTitle>
      </DialogHeader>

      <NameField id="rename-folder-name" value={name} onChange={setName} />

      <DialogFooter className="sm:justify-end">
        <CancelButton />
        <SubmitButton disabled={trimmed === ""}>Save</SubmitButton>
      </DialogFooter>
    </form>
  );
}
