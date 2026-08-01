import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, predictable pricing.",
};

export default function PricingPage() {
  return (
    <Container className="py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 text-muted-foreground">
        Plans and billing land here once the payment provider is wired up.
      </p>
    </Container>
  );
}
