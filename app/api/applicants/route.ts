import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { createApplicant, findApplicantByEmail } from "@/lib/db/applicants";
import { roleExists } from "@/lib/db/roles";
import { applicantSchema } from "@/lib/validation/requests";

/** POST /api/applicants — add an applicant to the talent pool. Files are uploaded separately. */
export const POST = apiHandler(async (request) => {
  const user = await requireApiUser(request);
  const input = applicantSchema.parse(await readJson(request));
  if (input.roleId && !(await roleExists(input.roleId))) throw new ApiError(404, "Selected role no longer exists.");
  if (input.email) {
    const existing = await findApplicantByEmail(input.email);
    if (existing) throw new ApiError(409, `${existing.fullName} is already saved with this email.`);
  }
  const { id } = await createApplicant(input, user.id);
  return NextResponse.json({ applicant: { id } }, { status: 201 });
});
