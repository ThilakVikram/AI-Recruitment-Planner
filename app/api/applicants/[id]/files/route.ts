import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { addApplicantFiles, applicantExists } from "@/lib/db/applicants";
import { tryExtractText, validateApplicantFile } from "@/lib/applicants/file";
import { APPLICANT_FILE_MAX_BYTES, APPLICANT_FILES_PER_UPLOAD } from "@/lib/applicants/constants";
import { toFileDTO } from "@/lib/applicants/dto";
import { applicantFileKindSchema } from "@/lib/validation/requests";

type Ctx = RouteContext<"/api/applicants/[id]/files">;

const MAX_REQUEST_BYTES = APPLICANT_FILE_MAX_BYTES * APPLICANT_FILES_PER_UPLOAD + 1024 * 1024;

/** POST /api/applicants/:id/files — multipart `files` plus one `kind` for the batch. */
export const POST = apiHandler(async (request, ctx: Ctx) => {
  await requireApiUser(request);
  const { id } = await ctx.params;
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) throw new ApiError(413, "Upload is too large.");
  if (!(await applicantExists(id))) throw new ApiError(404, "Applicant not found.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "Expected a multipart/form-data upload.");
  }
  const kind = applicantFileKindSchema.parse(form.get("kind"));
  const entries = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (!entries.length) throw new ApiError(400, "No files were uploaded.");
  if (entries.length > APPLICANT_FILES_PER_UPLOAD) throw new ApiError(400, `Upload at most ${APPLICANT_FILES_PER_UPLOAD} files at a time.`);

  const validated = await Promise.all(entries.map(validateApplicantFile));
  const prepared = await Promise.all(
    validated.map(async (f) => ({
      kind,
      originalFileName: f.originalFileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      fileHash: f.fileHash,
      bytes: f.bytes,
      extractedText: await tryExtractText(f),
    })),
  );
  const files = await addApplicantFiles(id, prepared);
  return NextResponse.json({ files: files.map(toFileDTO) }, { status: 201 });
});
