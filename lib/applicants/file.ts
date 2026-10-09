import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "@/lib/api/errors";
import { sanitizeFileName } from "@/lib/cv/file";
import { extractCvText } from "@/lib/cv/extract";
import { APPLICANT_FILE_MAX_BYTES, APPLICANT_FILE_TYPES, type ApplicantFileExtension } from "./constants";

export type ValidatedApplicantFile = {
  originalFileName: string;
  extension: ApplicantFileExtension;
  mimeType: string;
  sizeBytes: number;
  fileHash: string;
  bytes: Uint8Array;
};

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((b, i) => bytes[i] === b);
}

/** Content checks so a renamed file can't masquerade as an accepted type. */
const SIGNATURES: Record<ApplicantFileExtension, (bytes: Uint8Array) => boolean> = {
  // "%PDF-" within the first KB (some generators emit leading junk).
  pdf: (b) => Buffer.from(b.subarray(0, 1024)).includes("%PDF-"),
  doc: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  docx: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  txt: (b) => !b.subarray(0, 8192).includes(0),
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  jpeg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
};

export async function validateApplicantFile(file: File): Promise<ValidatedApplicantFile> {
  const originalFileName = sanitizeFileName(file.name || "document");
  const extension = originalFileName.split(".").pop()?.toLowerCase() as ApplicantFileExtension;

  if (!(extension in APPLICANT_FILE_TYPES)) {
    throw new ApiError(400, `"${originalFileName}" is not an accepted file type. Use PDF, DOC, DOCX, TXT, PNG or JPG.`);
  }
  if (file.size === 0) throw new ApiError(400, `"${originalFileName}" is empty.`);
  if (file.size > APPLICANT_FILE_MAX_BYTES) {
    throw new ApiError(413, `"${originalFileName}" is larger than ${APPLICANT_FILE_MAX_BYTES / 1024 / 1024} MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!SIGNATURES[extension](bytes)) {
    throw new ApiError(400, `"${originalFileName}" does not look like a valid .${extension} file.`);
  }

  return {
    originalFileName,
    extension,
    mimeType: APPLICANT_FILE_TYPES[extension],
    sizeBytes: bytes.byteLength,
    fileHash: createHash("sha256").update(bytes).digest("hex"),
    bytes,
  };
}

/** Best-effort text for PDF/TXT so CVs are searchable later; never blocks the upload. */
export async function tryExtractText(file: ValidatedApplicantFile): Promise<string | null> {
  if (file.extension !== "pdf" && file.extension !== "txt") return null;
  try {
    return await extractCvText(file.bytes, file.extension, file.originalFileName);
  } catch {
    return null;
  }
}
