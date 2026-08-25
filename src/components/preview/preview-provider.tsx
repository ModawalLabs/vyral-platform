"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { PreviewDialog } from "@/components/preview/preview-dialog";
import type { PreviewItem } from "@/types/preview";

type PreviewContextValue = {
  /** Opens the dialog on this item, replacing whatever was there. */
  open: (item: PreviewItem) => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

/**
 * Opens the preview dialog from anywhere in the workspace.
 *
 * Context rather than props, because the three things that open it are all buried: an
 * inspiration card inside a wall inside the home page, a hover action inside a project
 * card inside a grid inside the library, a template card inside a paginated grid.
 * Threading `onPreview` down each of those chains would put a prop on six components
 * that have no other reason to know the dialog exists.
 *
 * Mounted once in the workspace layout, so there is exactly one dialog in the tree
 * rather than one per card.
 */
export function usePreview(): PreviewContextValue {
  const value = useContext(PreviewContext);
  if (!value) {
    throw new Error("usePreview must be used inside <PreviewProvider>");
  }
  return value;
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  /*
   * Two pieces of state, not one nullable item.
   *
   * Closing has to leave the item in place: the dialog animates out over ~100ms, and
   * clearing the item on the same tick would empty its content mid-fade. The item is
   * replaced on the next open instead, so the outgoing one is on screen for exactly as
   * long as it is visible.
   */
  const [item, setItem] = useState<PreviewItem | null>(null);
  const [open, setOpen] = useState(false);

  // Memoised so every consumer does not re-render each time this provider does — and
  // `setItem`/`setOpen` are themselves stable, so the dependency list is genuinely empty.
  const value = useMemo<PreviewContextValue>(
    () => ({
      open: (next) => {
        setItem(next);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <PreviewContext.Provider value={value}>
      {children}
      <PreviewDialog item={item} open={open} onOpenChange={setOpen} />
    </PreviewContext.Provider>
  );
}
