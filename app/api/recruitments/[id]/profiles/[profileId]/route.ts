import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { deleteRecruitmentProfile } from "@/lib/db/recruitments";
import { analyzeRecruitmentProfile } from "@/lib/recruitment/generate";
import { toProfileDTO } from "@/lib/recruitment/dto";
import { recruitmentIdSchema } from "@/lib/validation/requests";

export const maxDuration = 120;

type Ctx = RouteContext<"/api/recruitments/[id]/profiles/[profileId]">;

/** POST — (re)analyse one profile, e.g. after the JD was regenerated or a failed attempt. */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  const profile = await analyzeRecruitmentProfile(id, params.profileId);
  return NextResponse.json({ profile: toProfileDTO(profile) });
});

/** DELETE — remove a pasted profile from this recruitment. */
export const DELETE = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  if (!(await deleteRecruitmentProfile(id, params.profileId))) throw new ApiError(404, "Profile not found.");
  return NextResponse.json({ ok: true });
});
