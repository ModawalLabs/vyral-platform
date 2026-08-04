import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

/** Standard heading + body frame for workspace pages. */
export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Container className="py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </Container>
  );
}
