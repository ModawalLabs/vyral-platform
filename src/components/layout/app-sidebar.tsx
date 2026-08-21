"use client";

import {
  FolderKanban,
  HardDriveDownload,
  Home,
  LayoutTemplate,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeSwitch } from "@/components/layout/theme-switch";
import { routes } from "@/config/routes";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "@/config/ui";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: routes.home, Icon: Home },
  { label: "Projects", href: routes.projects, Icon: FolderKanban },
  // Between Projects and Templates on purpose: an export comes *out of* a project, so
  // it reads as the next step along that line rather than as a sibling of Templates.
  { label: "Exports", href: routes.exports, Icon: HardDriveDownload },
  { label: "Templates", href: routes.templates, Icon: LayoutTemplate },
] as const;

/** Controlled by `SidebarShell`, which also owns the content offset. */
export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toggle = onToggle;

  return (
    <aside
      data-collapsed={collapsed}
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out"
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 px-3",
          collapsed && "justify-center",
        )}
      >
        <Link
          href={routes.home}
          className="flex min-w-0 items-center gap-2.5"
          aria-label={siteConfig.name}
        >
          {/* Placeholder mark — swap for the real logo asset. */}
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-accent text-base font-bold text-brand-foreground shadow-sm"
          >
            V
          </span>
          {!collapsed && (
            <span className="truncate text-[15px] font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            aria-expanded
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <PanelLeftClose className="size-[18px]" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggle}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          aria-expanded={false}
          className="mx-auto mb-2 grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <PanelLeftOpen className="size-[18px]" />
        </button>
      )}

      {/* Primary action */}
      <div className={cn("px-3 pb-2", collapsed && "px-2")}>
        {/* A link, not a button: /new is a route, so middle-click and
            open-in-new-tab have to keep working. */}
        <Link
          href={routes.newVideo}
          title={collapsed ? "New Video" : undefined}
          aria-label={collapsed ? "New Video" : undefined}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent text-sm font-medium text-brand-foreground shadow-lg shadow-brand/25 transition-[filter,box-shadow] hover:shadow-brand/40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
            collapsed && "px-0",
          )}
        >
          {collapsed ? (
            <Plus className="size-[18px]" />
          ) : (
            <>
              New Video
              <Plus className="size-4" />
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Workspace"
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2",
          collapsed && "px-2",
        )}
      >
        {NAV_ITEMS.map(({ label, href, Icon }) => {
          // Home is an exact match; the rest own their subtrees.
          const active =
            href === routes.home ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme, settings, log out */}
      <div
        className={cn(
          "flex flex-col gap-2 border-t border-sidebar-border p-3",
          collapsed && "items-center px-2",
        )}
      >
        <ThemeSwitch collapsed={collapsed} />

        {/*
          Upgrade sits directly above Settings, and is the one nav item that is not
          muted grey: it is the only link here that sells something, so it carries the
          brand colour while everything around it stays quiet. Same geometry as the
          other footer links, so the row rhythm is untouched.
        */}
        <Link
          href={routes.upgrade}
          title={collapsed ? "Upgrade" : undefined}
          aria-current={pathname.startsWith(routes.upgrade) ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
            collapsed && "w-10 justify-center px-0",
            pathname.startsWith(routes.upgrade)
              ? "bg-brand/15 text-brand-text"
              : "text-brand-text hover:bg-brand/10",
          )}
        >
          <Sparkles className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Upgrade</span>}
        </Link>

        <Link
          href={routes.settings}
          title={collapsed ? "Settings" : undefined}
          aria-current={pathname.startsWith(routes.settings) ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            collapsed && "w-10 justify-center px-0",
            pathname.startsWith(routes.settings)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>

        {/*
          Still a button rather than a link: signing out is an action that clears a
          session, and the navigation afterwards is a consequence of it, not the point.
          Making it an `<a href="/sign-in">` would offer middle-click and
          open-in-new-tab on something that is not a destination.

          For now the action is only the navigation, since there is no session to clear.

          TODO: call the provider's sign-out first, then push. The session gate is in
          `src/proxy.ts`, which already covers every workspace prefix.
        */}
        <button
          type="button"
          onClick={() => router.push(routes.signIn)}
          title={collapsed ? "Log out" : undefined}
          aria-label={collapsed ? "Log out" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            collapsed && "w-10 justify-center px-0",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
