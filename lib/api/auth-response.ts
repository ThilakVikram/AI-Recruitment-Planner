import "server-only";
import { NextResponse } from "next/server";
import { isAPIError } from "better-auth/api";
import { ApiError } from "./errors";

/** Copies Set-Cookie headers produced by a Better Auth server call onto our JSON response. */
export function jsonWithAuthHeaders(body: unknown, authHeaders: Headers | null | undefined, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  for (const cookie of authHeaders?.getSetCookie?.() ?? []) response.headers.append("set-cookie", cookie);
  return response;
}

/** Maps Better Auth API errors to user-safe ApiErrors. */
export function mapAuthError(error: unknown, fallback: string): never {
  if (isAPIError(error)) {
    const status = typeof error.statusCode === "number" ? error.statusCode : 400;
    if (status === 429) throw new ApiError(429, "Too many attempts. Please wait a minute and try again.");
    throw new ApiError(status >= 500 ? 500 : status, fallback);
  }
  throw error;
}
