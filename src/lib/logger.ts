import { env } from "@/env";

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: Level = env.NODE_ENV === "production" ? "info" : "debug";

type Context = Record<string, unknown>;

/**
 * Structured logging. Emits single-line JSON in production so log aggregators
 * (Datadog, CloudWatch, Axiom, …) can index fields without a parser, and
 * human-readable output locally.
 *
 * Swap the `emit` body for a transport when a vendor is chosen — every call
 * site stays unchanged.
 */
function emit(level: Level, message: string, context?: Context) {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line =
    env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${level.toUpperCase()}] ${message}${context ? ` ${JSON.stringify(context)}` : ""}`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Context) => emit("debug", message, context),
  info: (message: string, context?: Context) => emit("info", message, context),
  warn: (message: string, context?: Context) => emit("warn", message, context),
  error: (message: string, context?: Context) => emit("error", message, context),

  /** Returns a logger that stamps every entry with the given fields. */
  child(base: Context) {
    return {
      debug: (m: string, c?: Context) => emit("debug", m, { ...base, ...c }),
      info: (m: string, c?: Context) => emit("info", m, { ...base, ...c }),
      warn: (m: string, c?: Context) => emit("warn", m, { ...base, ...c }),
      error: (m: string, c?: Context) => emit("error", m, { ...base, ...c }),
    };
  },
};
