import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteApplicant, findApplicantByEmail, updateApplicant } from "@/lib/db/applicants";
import { roleExists } from "@/lib/db/roles";
import { applicantSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/applicants/[id]">;

/** PUT /api/applicants/:id — replace an applicant's details (the edit form always sends the full record). */
export const PUT = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  const input = applicantSchema.parse(await readJson(request));
  if (input.roleId && !(await roleExists(input.roleId))) throw new ApiError(404, "Selected role no longer exists.");
  if (input.email) {
    const existing = await findApplicantByEmail(input.email, id);
    if (existing) throw new ApiError(409, `${existing.fullName} is already saved with this email.`);
  }
  if (!(await updateApplicant(id, input))) throw new ApiError(404, "Applicant not found.");
  return NextResponse.json({ ok: true });
});

/** DELETE /api/applicants/:id — remove an applicant and all their files. */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  if (!(await deleteApplicant(id))) throw new ApiError(404, "Applicant not found.");
  return NextResponse.json({ ok: true });
});
