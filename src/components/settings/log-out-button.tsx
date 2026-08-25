"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

/**
 * Sign out, from the account panel.
 *
 * Moved here off the sidebar footer. It belongs with the identity it ends rather than at
 * the bottom of a nav column — and the sidebar is the one place in the app you cannot
 * avoid clicking through, which is the wrong place for the one control that throws your
 * work away.
 *
 * Still a button rather than a link: signing out is an action that clears a session, and
 * the navigation afterwards is a consequence of it, not the point. Making it an
 * `<a href="/sign-in">` would offer middle-click and open-in-new-tab on something that is
 * not a destination.
 *
 * For now the action is only the navigation, since there is no session to clear.
 *
 * TODO: call the provider's sign-out first, then push. The session gate is in
 * `src/proxy.ts`, which already covers every workspace prefix.
 */
export function LogOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(routes.signIn)}
      data-slot="log-out"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-colors",
        // Warm rather than red. It is not destructive — nothing is lost and you can sign
        // straight back in — but it is the one control on the page you do not want to hit
        // by accident, so it does not look like Edit either.
        "text-muted-foreground ring-1 ring-foreground/10 ring-inset",
        "hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/25",
        "focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none",
        className,
      )}
    >
      <LogOut aria-hidden className="size-3.5" />
      Log out
    </button>
  );
}
