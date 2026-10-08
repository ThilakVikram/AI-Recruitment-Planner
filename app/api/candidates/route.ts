import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { listCandidates } from "@/lib/db/candidates";

/** GET /api/candidates?roleId= — ranked candidates of one role, with tracker state. */
export const GET = apiHandler(async (request) => {
  await requireApiUser(request);
  const roleId = z.string().min(1).max(64).parse(new URL(request.url).searchParams.get("roleId"));
  return NextResponse.json({ candidates: await listCandidates(roleId) });
});
