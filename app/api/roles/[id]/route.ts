import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getRole, roleExists, updateRole } from "@/lib/db/roles";
import { getStages } from "@/lib/db/stages";
import { roleUpdateSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/roles/[id]">;

/** GET /api/roles/:id — the role and its seven stages. */
export const GET = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const role = await getRole(id);
  if (!role) throw new ApiError(404, "Role not found.");
  return NextResponse.json({ role, stages: await getStages(id) });
});

/** PUT /api/roles/:id — rename / update description. */
export const PUT = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  if (!(await roleExists(id))) throw new ApiError(404, "Role not found.");
  const body = roleUpdateSchema.parse(await readJson(request));
  return NextResponse.json({ role: await updateRole(id, body) });
});
