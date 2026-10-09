import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteRecruitment, updateRecruitment } from "@/lib/db/recruitments";
import { recruitmentIdSchema, recruitmentUpdateSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/recruitments/[id]">;

/** PATCH /api/recruitments/:id — update summary, status and/or openings. */
export const PATCH = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  const body = recruitmentUpdateSchema.parse(await readJson(request));
  if (!(await updateRecruitment(id, body))) throw new ApiError(404, "Recruitment not found.");
  return NextResponse.json({ ok: true });
});

/** DELETE /api/recruitments/:id — removes notes, AI output and applications. Applicants and CVs are kept. */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  if (!(await deleteRecruitment(id))) throw new ApiError(404, "Recruitment not found.");
  return NextResponse.json({ ok: true });
});
