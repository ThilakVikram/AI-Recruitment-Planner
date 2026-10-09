import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { createRecruitment } from "@/lib/db/recruitments";
import { recruitmentSlug } from "@/lib/recruitment/constants";
import { recruitmentCreateSchema } from "@/lib/validation/requests";

/** POST /api/recruitments — start a recruitment for a role. Only the role is required. */
export const POST = apiHandler(async (request) => {
  const user = await requireApiUser(request);
  const body = recruitmentCreateSchema.parse(await readJson(request));
  const created = await createRecruitment(body, user.id);
  if (!created) throw new ApiError(404, "Selected role no longer exists.");
  return NextResponse.json({ recruitment: { id: created.id, slug: recruitmentSlug(created.id) } }, { status: 201 });
});
