import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "@/lib/api/errors";
import { CV_ALLOWED_EXTENSIONS, CV_MAX_FILE_BYTES } from "@/lib/workflow/constants";

export type CvFileType = (typeof CV_ALLOWED_EXTENSIONS)[number];

export type ValidatedCvFile = {
  originalFileName: string; // sanitised for display/storage
  normalizedFileName: string; // for duplicate detection
  fileType: CvFileType;
  fileHash: string;
  bytes: Uint8Array;
};

/**
 * Strips any path components and unsafe characters from a client-supplied file name.
 * The name is only stored as metadata — files are never written to disk.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\p{L}\p{N}._ ()-]/gu, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 200);
  return cleaned || "cv";
}

export function normalizeFileName(sanitized: string): string {
  return sanitized
    .toLowerCase()
    .replace(/\.(pdf|txt)$/i, "")
    .replace(/\(\d+\)$/, "") // "cv (1)" → "cv"
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function looksLikePdf(bytes: Uint8Array): boolean {
  // Allow a little leading junk/BOM as some generators emit it.
  const head = bytes.subarray(0, 1024);
  outer: for (let i = 0; i <= head.length - PDF_MAGIC.length; i++) {
    for (let j = 0; j < PDF_MAGIC.length; j++) if (head[i + j] !== PDF_MAGIC[j]) continue outer;
    return true;
  }
  return false;
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 8192);
  let nul = 0;
  for (const b of sample) if (b === 0) nul++;
  return nul === 0;
}

/** Validates type (extension + content signature) and size of an uploaded CV. */
export async function validateCvFile(file: File): Promise<ValidatedCvFile> {
  const originalFileName = sanitizeFileName(file.name || "cv");
  const ext = extensionOf(originalFileName);

  if (!(CV_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ApiError(400, `Invalid CV file type: "${originalFileName}". Only PDF and TXT files are accepted.`);
  }
  if (file.size === 0) throw new ApiError(400, `"${originalFileName}" is empty.`);
  if (file.size > CV_MAX_FILE_BYTES) {
    throw new ApiError(413, `"${originalFileName}" is larger than ${CV_MAX_FILE_BYTES / 1024 / 1024} MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileType = ext as CvFileType;

  if (fileType === "pdf" && !looksLikePdf(bytes)) {
    throw new ApiError(400, `Invalid CV file type: "${originalFileName}" is not a valid PDF.`);
  }
  if (fileType === "txt" && !looksLikeText(bytes)) {
    throw new ApiError(400, `Invalid CV file type: "${originalFileName}" is not a plain-text file.`);
  }

  return {
    originalFileName,
    normalizedFileName: normalizeFileName(originalFileName),
    fileType,
    fileHash: createHash("sha256").update(bytes).digest("hex"),
    bytes,
  };
}
