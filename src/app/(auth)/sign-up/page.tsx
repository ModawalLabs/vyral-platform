import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
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

/**
 * Registration.
 *
 * Carries its own centring and mark. Both used to live in the `(auth)` layout, but
 * sign-in needs the full width for a two-column composition, so the chrome came down to
 * the one page that still wants it.
 */
export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Link href={routes.home} className="mb-8 flex items-center gap-2 font-semibold">
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-md bg-foreground text-sm font-bold text-background"
        >
          V
        </span>
        {siteConfig.name}
      </Link>

      <div className="w-full max-w-sm">
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
      </div>
    </div>
  );
}
