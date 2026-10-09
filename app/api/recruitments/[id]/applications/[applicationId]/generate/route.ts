import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { generateApplicantOutput } from "@/lib/recruitment/generate";
import { recruitmentApplicantGenerateSchema, recruitmentIdSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

type Ctx = RouteContext<"/api/recruitments/[id]/applications/[applicationId]/generate">;

/** POST — write outreach, the screening report or final decision messages for this applicant. */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  const { kind, input } = recruitmentApplicantGenerateSchema.parse(await readJson(request));
  const output = await generateApplicantOutput(id, params.applicationId, kind, input);
  return NextResponse.json({ output });
});
