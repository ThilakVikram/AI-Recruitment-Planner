import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteRole, getRole, roleExists, updateRole } from "@/lib/db/roles";
import { countRecruitmentsForRole } from "@/lib/db/recruitments";
import { roleSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/roles/[id]">;

/** GET /api/roles/:id — the role. */
export const GET = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const role = await getRole(id);
  if (!role) throw new ApiError(404, "Role not found.");
  return NextResponse.json({ role });
});

/** PUT /api/roles/:id — replace the role's requisition details (the edit form always sends the full record). */
export const PUT = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  if (!(await roleExists(id))) throw new ApiError(404, "Role not found.");
  const body = roleSchema.parse(await readJson(request));
  return NextResponse.json({ role: await updateRole(id, body) });
});

/** DELETE /api/roles/:id — delete the role (refused while recruitments use it). */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const recruitments = await countRecruitmentsForRole(id);
  if (recruitments) {
    throw new ApiError(409, `This role is used by ${recruitments} recruitment${recruitments === 1 ? "" : "s"}. Delete or reassign them first.`);
  }
  if (!(await deleteRole(id))) throw new ApiError(404, "Role not found.");
  return NextResponse.json({ ok: true });
});
