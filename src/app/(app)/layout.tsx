import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { SidebarShell } from "@/components/layout/sidebar-shell";
import { SIDEBAR_COOKIE } from "@/config/ui";

/**
 * Workspace shell. Reading the collapse cookie makes this segment dynamic,
 * which it would be anyway once the session lookup lands — and it buys a
 * flash-free first paint at the correct sidebar width.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "true";

  return <SidebarShell defaultCollapsed={collapsed}>{children}</SidebarShell>;
}
