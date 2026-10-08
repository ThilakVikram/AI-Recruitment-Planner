import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { roleExists } from "@/lib/db/roles";
import { createSourcingProfile, listSourcingProfiles } from "@/lib/db/sourcing";
import { sourcingProfileCreateSchema } from "@/lib/validation/requests";

/** GET /api/sourcing-profiles?roleId= */
export const GET = apiHandler(async (request) => {
  await requireApiUser(request);
  const roleId = z.string().min(1).max(64).parse(new URL(request.url).searchParams.get("roleId"));
  return NextResponse.json({ profiles: await listSourcingProfiles(roleId) });
});

/** POST /api/sourcing-profiles — add a manually pasted LinkedIn/Naukri profile (URL is never fetched). */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);
  const { roleId, ...data } = sourcingProfileCreateSchema.parse(await readJson(request));
  if (!(await roleExists(roleId))) throw new ApiError(404, "Role not found.");
  const profile = await createSourcingProfile(roleId, data);
  return NextResponse.json({ profile }, { status: 201 });
});
