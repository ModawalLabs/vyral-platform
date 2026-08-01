import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const navigation = [
  { label: "Pricing", href: routes.pricing },
  { label: "Dashboard", href: routes.dashboard },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={routes.home} className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-foreground text-sm font-bold text-background"
          >
            V
          </span>
          <span>{siteConfig.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <ButtonLink key={item.href} href={item.href} variant="ghost" size="sm">
              {item.label}
            </ButtonLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink href={routes.signIn} size="sm">
            Sign in
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
