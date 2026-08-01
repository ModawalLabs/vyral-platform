"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Catches render/data errors below the root layout. Next.js strips the message
 * in production and replaces it with a `digest` you can correlate with server
 * logs — never render `error.message` as if it were user-facing copy.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forward to the error tracker (Sentry, etc.) once one is configured.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We hit an unexpected error. Try again — if it keeps happening, contact support.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
