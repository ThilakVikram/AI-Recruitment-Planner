import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteSourcingProfile } from "@/lib/db/sourcing";

/** DELETE /api/sourcing-profiles/:id?roleId= */
export const DELETE = apiHandler(async (request, ctx: RouteContext<"/api/sourcing-profiles/[id]">) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const roleId = z.string().min(1).max(64).parse(new URL(request.url).searchParams.get("roleId"));
  if (!(await deleteSourcingProfile(roleId, id))) throw new ApiError(404, "Profile not found in this role.");
  return NextResponse.json({ ok: true });
});
