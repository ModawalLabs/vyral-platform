import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Sign-up is not wired up yet — drop the chosen provider&apos;s form here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Registration, verification, and onboarding all belong under this route group.
      </CardContent>
    </Card>
  );
}
