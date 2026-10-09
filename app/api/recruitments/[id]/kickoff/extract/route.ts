import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { fillKickoffFromNotes } from "@/lib/recruitment/generate";
import { recruitmentIdSchema, recruitmentKickoffExtractSchema } from "@/lib/validation/requests";

export const maxDuration = 120;

type Ctx = RouteContext<"/api/recruitments/[id]/kickoff/extract">;

/** POST — save the full pasted notes and let AI fill the kick-off form from them. */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  const { raw } = recruitmentKickoffExtractSchema.parse(await readJson(request));
  const fields = await fillKickoffFromNotes(id, raw);
  return NextResponse.json({ fields });
});
