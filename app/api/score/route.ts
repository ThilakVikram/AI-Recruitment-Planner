import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { readCvUpload } from "@/lib/api/upload";
import { roleExists } from "@/lib/db/roles";
import { rescoreCandidate, scoreCvFiles } from "@/lib/workflow/scoring";
import { rescoreSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

/**
 * POST /api/score
 * - multipart/form-data with `roleId` + `files[]` (PDF/TXT): score new/updated CVs
 * - application/json `{ roleId, candidateId }`: rescore an existing candidate from their stored CV
 * Rescoring never changes tracker decision or recruiter notes.
 */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);

  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = rescoreSchema.parse(await readJson(request));
    const result = await rescoreCandidate(body.roleId, body.candidateId);
    return NextResponse.json({ result });
  }

  const { form, files } = await readCvUpload(request);
  const roleId = z.string().min(1).max(64).parse(form.get("roleId"));
  if (!(await roleExists(roleId))) throw new ApiError(404, "Role not found.");

  const results = await scoreCvFiles(roleId, files);
  return NextResponse.json({ results });
});
