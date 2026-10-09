import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { addProfileAsApplicant } from "@/lib/recruitment/generate";
import { recruitmentIdSchema } from "@/lib/validation/requests";

export const maxDuration = 120;

type Ctx = RouteContext<"/api/recruitments/[id]/profiles/[profileId]/applicant">;

/**
 * POST { move?: boolean } — add an analysed profile to this recruitment's applicants
 * (scored against the JD like a CV). `move: true` also removes it from the profile list.
 */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  const user = await requireApiUser(request);
  const params = await ctx.params;
  const id = recruitmentIdSchema.parse(params.id);
  const { move } = z.object({ move: z.boolean().default(false) }).parse(await readJson(request));
  const result = await addProfileAsApplicant(id, params.profileId, user.id, move);
  return NextResponse.json({ result }, { status: 201 });
});
