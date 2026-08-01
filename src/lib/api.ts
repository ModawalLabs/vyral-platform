import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { toAppError, validationError } from "@/lib/errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(error: unknown) {
  const appError = toAppError(error);

  if (!appError.expose) {
    logger.error(appError.message, {
      code: appError.code,
      cause: appError.cause instanceof Error ? appError.cause.message : appError.cause,
      stack: appError.stack,
    });
  }

  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.expose ? appError.message : "An unexpected error occurred.",
        ...(appError.details ? { details: appError.details } : {}),
      },
    },
    { status: appError.status },
  );
}

/** Parse a JSON body against a schema, throwing a typed 422 on mismatch. */
export async function parseJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw validationError(undefined, "Request body must be valid JSON.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw validationError(z.flattenError(result.error), "Invalid request body.");
  }
  return result.data;
}

/** Parse search params against a schema, throwing a typed 422 on mismatch. */
export function parseSearchParams<S extends z.ZodType>(
  request: Request,
  schema: S,
): z.infer<S> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    throw validationError(z.flattenError(result.error), "Invalid query parameters.");
  }
  return result.data;
}

/**
 * Wrap a route handler so thrown `AppError`s become well-formed JSON responses
 * and unexpected throws never leak a stack trace to the client.
 */
export function handler<Args extends unknown[]>(
  fn: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await fn(request, ...args);
    } catch (error) {
      return fail(error);
    }
  };
}
