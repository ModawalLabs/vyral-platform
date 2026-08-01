import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Single source of truth for environment variables.
 *
 * Anything not declared here is invisible to the app — import `env` instead of
 * reaching for `process.env` so that a missing or malformed variable fails at
 * build time rather than in production traffic.
 */
export const env = createEnv({
  /**
   * Server-only. Never shipped to the browser; referencing these from a client
   * component throws at runtime.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // DATABASE_URL: z.url(),
    // AUTH_SECRET: z.string().min(32),
  },

  /**
   * Exposed to the browser. Must be prefixed with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },

  /**
   * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so client vars
   * have to be destructured explicitly rather than read dynamically.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /** Lets `next build` succeed in CI/Docker without a full env. */
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
