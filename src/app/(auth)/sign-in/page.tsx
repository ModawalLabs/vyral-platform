import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Authentication is not wired up yet — drop the chosen provider&apos;s form here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        See <code className="font-mono">src/proxy.ts</code> for the route protection hook
        point.
      </CardContent>
    </Card>
  );
}
