import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { roleExists } from "@/lib/db/roles";
import { saveStageInput } from "@/lib/db/stages";
import { stageSaveSchema } from "@/lib/validation/requests";

/** PUT /api/stages — persist a stage's input (and selected candidates) without generating. */
export const PUT = apiHandler(async (request) => {
  await requireApiUser(request);
  const body = stageSaveSchema.parse(await readJson(request));
  if (!(await roleExists(body.roleId))) throw new ApiError(404, "Role not found.");
  const stage = await saveStageInput(body.roleId, body.stageNumber, {
    ...(body.input !== undefined ? { input: body.input } : {}),
    ...(body.candidateIds !== undefined ? { inputData: { candidateIds: body.candidateIds } } : {}),
  });
  return NextResponse.json({ stage });
});
