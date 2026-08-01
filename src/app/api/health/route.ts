import { handler, ok } from "@/lib/api";

/** Never cached — load balancers and uptime checks need live status. */
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Extend with dependency checks (database, cache,
 * queue) as they are added, and return a non-200 when any of them is down so
 * orchestrators stop routing traffic here.
 */
export const GET = handler(async () =>
  ok({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }),
);
