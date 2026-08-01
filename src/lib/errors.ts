/**
 * Application error taxonomy.
 *
 * Throwing these instead of bare `Error`s lets route handlers and server
 * actions map failures onto HTTP status codes and safe client messages without
 * leaking internals.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Safe to render to end users. */
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: unknown; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.expose = code !== "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export const badRequest = (message = "Bad request", details?: unknown) =>
  new AppError("BAD_REQUEST", message, { details });

export const unauthorized = (message = "You must be signed in.") =>
  new AppError("UNAUTHORIZED", message);

export const forbidden = (message = "You do not have access to this resource.") =>
  new AppError("FORBIDDEN", message);

export const notFound = (message = "Not found") => new AppError("NOT_FOUND", message);

export const conflict = (message = "That resource already exists.") =>
  new AppError("CONFLICT", message);

export const rateLimited = (message = "Too many requests. Please slow down.") =>
  new AppError("RATE_LIMITED", message);

export const validationError = (details: unknown, message = "Invalid input.") =>
  new AppError("VALIDATION_ERROR", message, { details });

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Coerce anything thrown into an AppError, hiding unexpected internals. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred.", {
    cause: error,
  });
}
