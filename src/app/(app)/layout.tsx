import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { PreviewProvider } from "@/components/preview/preview-provider";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { SIDEBAR_COOKIE } from "@/config/ui";
import { getCredits } from "@/data/account";

/**
 * Workspace shell. Reading the collapse cookie makes this segment dynamic,
 * which it would be anyway once the session lookup lands — and it buys a
 * flash-free first paint at the correct sidebar width.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  /*
   * The balance is fetched here, not in the sidebar.
   *
   * `src/data/account.ts` is `server-only` and the sidebar is a client component, so the
   * dial cannot fetch for itself. Reading it in the layout also means every workspace
   * page shows the same figure without each one having to remember to pass it.
   */
  const [cookieStore, credits] = await Promise.all([cookies(), getCredits()]);
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "true";

  /*
   * One preview dialog for the whole workspace.
   *
   * Mounted here rather than per page because three different surfaces open it — the
   * home inspiration wall, the project library and the template grid — and each of the
   * cards that does is several components deep. See `PreviewProvider`.
   */
  return (
    <SidebarShell defaultCollapsed={collapsed} credits={credits}>
      <PreviewProvider>{children}</PreviewProvider>
    </SidebarShell>
  );
}
