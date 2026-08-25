"use client";

import { useState, type ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SIDEBAR_COOKIE,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "@/config/ui";
import type { CreditBalance } from "@/types/account";

/**
 * Owns the collapse state for both the sidebar and the content offset, so the
 * two always animate together.
 *
 * `children` arrives as an already-rendered server tree — passing it through a
 * client component costs nothing and keeps every page a server component.
 */
export function SidebarShell({
  defaultCollapsed,
  credits,
  children,
}: {
  defaultCollapsed: boolean;
  /** Passed straight through to the sidebar dial — see `SidebarCredits`. */
  credits: CreditBalance;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Written client-side so the next server render already knows the width —
    // no action round trip, no flash of the wrong layout on reload.
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
  }

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar collapsed={collapsed} onToggle={toggle} credits={credits} />
      {/* Mirrors the fixed sidebar's width so content is never underlapped;
          both sides share a curve, so the edge stays in step. */}
      <div
        style={{ paddingLeft: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
        className="flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out"
      >
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
