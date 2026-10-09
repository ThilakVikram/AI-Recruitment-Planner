import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { generateRecruitmentSection } from "@/lib/recruitment/generate";
import { toSectionDTO } from "@/lib/recruitment/dto";
import { recruitmentGenerateSchema, recruitmentIdSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

type Ctx = RouteContext<"/api/recruitments/[id]/generate">;

/** POST /api/recruitments/:id/generate — run one AI section and store its output. */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  const { section, input } = recruitmentGenerateSchema.parse(await readJson(request));
  const saved = await generateRecruitmentSection(id, section, input);
  return NextResponse.json({ section: toSectionDTO(saved) });
});
