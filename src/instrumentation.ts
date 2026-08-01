import type { Instrumentation } from "next";

/**
 * Runs once per server process, before any request is handled. This is where
 * an APM/tracing SDK (OpenTelemetry, Sentry, Datadog) gets initialized.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // await import("./instrumentation.node");
  }
}

/** Server-side counterpart to the client error boundary. */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  console.error("[request-error]", {
    message: error instanceof Error ? error.message : String(error),
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    renderSource: context.renderSource,
  });
};
