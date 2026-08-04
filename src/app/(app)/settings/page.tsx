import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Account, workspace, and billing preferences."
    >
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Wire this up once auth is in place.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Server actions for mutations belong in a colocated{" "}
          <code className="font-mono">actions.ts</code>.
        </CardContent>
      </Card>
    </PageShell>
  );
}
