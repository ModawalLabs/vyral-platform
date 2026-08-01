import Link from "next/link";
import type { ReactNode } from "react";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Link href={routes.home} className="mb-8 flex items-center gap-2 font-semibold">
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-md bg-foreground text-sm font-bold text-background"
        >
          V
        </span>
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
