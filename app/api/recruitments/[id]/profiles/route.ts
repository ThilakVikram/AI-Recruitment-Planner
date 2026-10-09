import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { AIError } from "@/lib/ai/errors";
import { createRecruitmentProfile, getRecruitmentProfile, listRecruitmentProfiles, recruitmentExists } from "@/lib/db/recruitments";
import { analyzeRecruitmentProfile, recruitmentHasJd } from "@/lib/recruitment/generate";
import { toProfileDTO } from "@/lib/recruitment/dto";
import { recruitmentIdSchema, recruitmentProfileCreateSchema } from "@/lib/validation/requests";

export const maxDuration = 120;

type Ctx = RouteContext<"/api/recruitments/[id]/profiles">;

/** GET — analysed profiles for this recruitment, best fit first. */
export const GET = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  return NextResponse.json({ profiles: (await listRecruitmentProfiles(id)).map(toProfileDTO) });
});

/**
 * POST — save a pasted LinkedIn / Naukri profile and analyse it against the JD straight away.
 * If the AI call fails the profile is still saved, and the error is returned for a retry.
 */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  const body = recruitmentProfileCreateSchema.parse(await readJson(request));
  if (!(await recruitmentExists(id))) throw new ApiError(404, "Recruitment not found.");
  if (!(await recruitmentHasJd(id))) {
    throw new ApiError(400, "No job description yet. Add kick-off notes and generate the “Job Management” section first.");
  }

  const created = await createRecruitmentProfile(id, { ...body, referenceUrl: body.referenceUrl || null });
  try {
    const analysed = await analyzeRecruitmentProfile(id, created.id);
    return NextResponse.json({ profile: toProfileDTO(analysed) }, { status: 201 });
  } catch (error) {
    if (!(error instanceof AIError || error instanceof ApiError)) throw error;
    const saved = await getRecruitmentProfile(id, created.id);
    return NextResponse.json({ profile: toProfileDTO(saved!), error: error.message }, { status: 201 });
  }
});
