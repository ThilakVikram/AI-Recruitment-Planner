import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { roleExists } from "@/lib/db/roles";
import { listSourcingProfiles } from "@/lib/db/sourcing";
import { analyzeSourcingProfiles } from "@/lib/workflow/sourcing";
import { sourcingAnalyzeSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

/** POST /api/sourcing-profiles/analyze — score pasted profiles and return the ranked shortlist. */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);
  const body = sourcingAnalyzeSchema.parse(await readJson(request));
  if (!(await roleExists(body.roleId))) throw new ApiError(404, "Role not found.");
  const results = await analyzeSourcingProfiles(body.roleId, body.profileIds);
  return NextResponse.json({ results, profiles: await listSourcingProfiles(body.roleId) });
});
