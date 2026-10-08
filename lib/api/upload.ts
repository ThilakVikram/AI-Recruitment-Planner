import "server-only";
import { ApiError } from "./errors";
import { validateCvFile, type ValidatedCvFile } from "@/lib/cv/file";
import { CV_MAX_FILE_BYTES, CV_MAX_FILES_PER_UPLOAD } from "@/lib/workflow/constants";

const MAX_REQUEST_BYTES = CV_MAX_FILE_BYTES * CV_MAX_FILES_PER_UPLOAD + 1024 * 1024;

/** Parses a multipart CV upload in memory and validates every file. */
export async function readCvUpload(request: Request): Promise<{ form: FormData; files: ValidatedCvFile[] }> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) throw new ApiError(413, "Upload is too large.");
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    throw new ApiError(400, "Expected a multipart/form-data upload.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "Could not read the uploaded files.");
  }
  const entries = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (!entries.length) throw new ApiError(400, "No files were uploaded.");
  if (entries.length > CV_MAX_FILES_PER_UPLOAD) {
    throw new ApiError(400, `Upload at most ${CV_MAX_FILES_PER_UPLOAD} CVs at a time.`);
  }
  const files = await Promise.all(entries.map(validateCvFile));
  return { form, files };
}
