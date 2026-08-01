import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const pillars = [
  {
    title: "Typed end to end",
    body: "Strict TypeScript, validated environment variables, and typed routes — mistakes surface at build time, not in production.",
  },
  {
    title: "Built to scale",
    body: "App Router with server components by default, standalone Docker output, and structured logging ready for any observability vendor.",
  },
  {
    title: "Consistent by design",
    body: "shadcn/ui on Tailwind v4 tokens, so every surface inherits the same spacing, color, and dark-mode behavior.",
  },
];

export default function HomePage() {
  return (
    <Container className="py-24">
      <section className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {siteConfig.shortName} Platform
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteConfig.description}
        </h1>
        <p className="mt-6 text-lg text-pretty text-muted-foreground">
          A production foundation — routing, theming, validation, testing, and CI already
          wired up. Start building features, not scaffolding.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <ButtonLink href={routes.dashboard} size="lg">
            Open dashboard
          </ButtonLink>
          <ButtonLink href={routes.pricing} size="lg" variant="outline">
            View pricing
          </ButtonLink>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <CardTitle>{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {pillar.body}
            </CardContent>
          </Card>
        ))}
      </section>
    </Container>
  );
}
