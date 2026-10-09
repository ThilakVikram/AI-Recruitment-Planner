import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteApplication, updateApplication } from "@/lib/db/recruitments";
import { recruitmentApplicationUpdateSchema, recruitmentIdSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/recruitments/[id]/applications/[applicationId]">;

/** PATCH — set the recruiter's decision, interview screening notes and/or final decision for an application. */
export const PATCH = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  const body = recruitmentApplicationUpdateSchema.parse(await readJson(request));
  if (!(await updateApplication(id, params.applicationId, body))) throw new ApiError(404, "Application not found.");
  return NextResponse.json({ ok: true });
});

/** DELETE — remove from this recruitment; the applicant and CV stay in Applicants. */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  if (!(await deleteApplication(id, params.applicationId))) throw new ApiError(404, "Application not found.");
  return NextResponse.json({ ok: true });
});
