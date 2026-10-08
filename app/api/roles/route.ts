import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { createRole, listRoles } from "@/lib/db/roles";
import { roleCreateSchema } from "@/lib/validation/requests";

/** GET /api/roles — all roles (every team member can access every role). */
export const GET = apiHandler(async (request) => {
  await requireApiUser(request);
  return NextResponse.json({ roles: await listRoles() });
});

/** POST /api/roles — create a role workspace with its seven empty stages. */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);
  const body = roleCreateSchema.parse(await readJson(request));
  const role = await createRole(body);
  return NextResponse.json({ role }, { status: 201 });
});
