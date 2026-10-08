import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler, readJson } from "@/lib/api/handler";
import { generateStage } from "@/lib/workflow/generate";
import { generateSchema } from "@/lib/validation/requests";

export const maxDuration = 300;

/** POST /api/generate — run the AI chain for a workflow stage and persist its output. */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);
  const body = generateSchema.parse(await readJson(request));
  const stage = await generateStage(body);
  return NextResponse.json({ stage });
});
