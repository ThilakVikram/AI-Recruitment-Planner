import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { saveKickoffNotes } from "@/lib/db/recruitments";
import { recruitmentIdSchema, recruitmentKickoffSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/recruitments/[id]/kickoff">;

/** PUT — save the kick-off notes: the structured kick-off form and the full notes. */
export const PUT = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const id = recruitmentIdSchema.parse((await ctx.params).id);
  const body = recruitmentKickoffSchema.parse(await readJson(request));
  if (!(await saveKickoffNotes(id, body))) throw new ApiError(404, "Recruitment not found.");
  return NextResponse.json({ ok: true });
});
