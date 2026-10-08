import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteCandidate, updateTracker } from "@/lib/db/candidates";
import { trackerUpdateSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/candidates/[id]">;

/** PATCH /api/candidates/:id — update tracker decision and/or recruiter notes. */
export const PATCH = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const { roleId, ...data } = trackerUpdateSchema.parse(await readJson(request));
  const tracker = await updateTracker(roleId, id, data);
  if (!tracker) throw new ApiError(404, "Candidate not found in this role.");
  return NextResponse.json({ tracker });
});

/** DELETE /api/candidates/:id?roleId= — remove a candidate (and their CVs/tracker) from a role. */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const roleId = z.string().min(1).max(64).parse(new URL(request.url).searchParams.get("roleId"));
  if (!(await deleteCandidate(roleId, id))) throw new ApiError(404, "Candidate not found in this role.");
  return NextResponse.json({ ok: true });
});
