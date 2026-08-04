"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { routes } from "@/config/routes";

/**
 * Leaves the full-screen composer.
 *
 * Prefers going back so the user lands wherever they opened it from, and falls
 * back to home when there is no history to return to — `/new` opened directly
 * from a link or a fresh tab.
 */
export function DismissCreate() {
  const router = useRouter();

  const dismiss = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(routes.home);
  }, [router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // The workspace's popups — the brief's settings pills, the model hover card —
      // close on Escape and mark the event handled. Without this check, dismissing a
      // model menu would also navigate away.
      if (event.defaultPrevented) return;
      dismiss();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Close"
      title="Close (Esc)"
      className="absolute top-5 right-5 z-10 grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <X className="size-5" />
    </button>
  );
}
