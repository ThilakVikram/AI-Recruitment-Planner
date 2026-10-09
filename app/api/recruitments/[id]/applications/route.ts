import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { readCvUpload } from "@/lib/api/upload";
import { recruitmentExists } from "@/lib/db/recruitments";
import { scoreRecruitmentCvs } from "@/lib/recruitment/generate";
import { recruitmentIdSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

type Ctx = RouteContext<"/api/recruitments/[id]/applications">;

/**
 * POST /api/recruitments/:id/applications — multipart `files` (PDF/TXT CVs).
 * Each CV is stored on an applicant (created if new), scored against the JD and added to this recruitment.
 */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  if (!(await recruitmentExists(id))) throw new ApiError(404, "Recruitment not found.");
  const { files } = await readCvUpload(request);
  const results = await scoreRecruitmentCvs(id, files, user.id);
  return NextResponse.json({ results });
});
