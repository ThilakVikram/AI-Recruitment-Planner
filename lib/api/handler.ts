import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";
import { AIError } from "@/lib/ai/errors";

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/**
 * Wraps a Route Handler so that expected errors become clean JSON responses and
 * unexpected ones are logged server-side without leaking stack traces.
 */
export function apiHandler<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error, `${request.method} ${new URL(request.url).pathname}`);
    }
  };
}

export function errorResponse(error: unknown, where: string): Response {
  if (error instanceof ApiError || error instanceof AIError) {
    if (error instanceof AIError && error.cause) {
      console.error(`[${where}] ${error.message}`, describeError(error.cause));
    }
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join(".");
    return NextResponse.json(
      { error: field ? `Invalid ${field}: ${issue.message}` : "Invalid request." },
      { status: 400 },
    );
  }
  console.error(`[${where}] Unexpected error`, describeError(error));
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Logs only error class, message and status — never request payloads (which may hold CV text). */
function describeError(error: unknown) {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    return { name: error.name, message: error.message, ...(status ? { status } : {}), stack: error.stack };
  }
  return { error: String(error) };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}
