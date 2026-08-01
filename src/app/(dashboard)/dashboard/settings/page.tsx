import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, workspace, and billing preferences.
        </p>
      </div>

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
    </div>
  );
}
