import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const sidebarLinks = [
  { label: "Overview", href: routes.dashboard },
  { label: "Settings", href: routes.settings },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <Container className="flex h-14 items-center justify-between">
          <Link href={routes.home} className="font-semibold">
            {siteConfig.name}
          </Link>
          <ThemeToggle />
        </Container>
      </header>

      <Container className="flex flex-1 gap-8 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav aria-label="Dashboard" className="flex flex-col gap-1 text-sm">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </Container>
    </div>
  );
}
