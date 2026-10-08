import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";

/** GET /api/me — the current user (allowed before the first-login password change). */
export const GET = apiHandler(async (request) => {
  const user = await requireApiUser(request, { allowPasswordChange: true });
  return NextResponse.json({ user });
});
