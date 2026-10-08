import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { readCvUpload } from "@/lib/api/upload";
import { extractCvText } from "@/lib/cv/extract";

/**
 * POST /api/extract-cv — multipart `files`: validates and extracts text from CVs
 * without storing them. Returns a short preview for the recruiter to sanity-check.
 */
export const POST = apiHandler(async (request) => {
  await requireApiUser(request);
  const { files } = await readCvUpload(request);
  const results = await Promise.all(
    files.map(async (f) => {
      const text = await extractCvText(f.bytes, f.fileType, f.originalFileName);
      return { fileName: f.originalFileName, fileType: f.fileType, characters: text.length, preview: text.slice(0, 400) };
    }),
  );
  return NextResponse.json({ files: results }, { headers: { "Cache-Control": "no-store" } });
});
