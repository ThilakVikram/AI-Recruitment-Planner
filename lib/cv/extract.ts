import "server-only";
import { ApiError } from "@/lib/api/errors";
import type { CvFileType } from "./file";

/** Upper bound on stored/sent CV text (~25k tokens); real CVs are far shorter. */
export const CV_TEXT_MAX_CHARS = 100_000;

/**
 * Extracts plain text from a CV entirely in memory (no temporary files).
 * Never log the returned text.
 */
export async function extractCvText(bytes: Uint8Array, fileType: CvFileType, displayName: string): Promise<string> {
  let text: string;
  if (fileType === "pdf") {
    text = await extractPdfText(bytes, displayName);
  } else {
    text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
  }

  text = cleanText(text);
  if (text.length < 30) {
    throw new ApiError(
      422,
      `Could not read enough text from "${displayName}". Scanned/image-only PDFs are not supported — please upload a text-based PDF or TXT.`,
    );
  }
  if (text.length > CV_TEXT_MAX_CHARS) {
    throw new ApiError(413, `"${displayName}" contains too much text to be a CV (over ${CV_TEXT_MAX_CHARS.toLocaleString()} characters).`);
  }
  return text;
}

async function extractPdfText(bytes: Uint8Array, displayName: string): Promise<string> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  try {
    // Copy: pdf.js may transfer/detach the buffer it is given.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    try {
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    } finally {
      await pdf.cleanup();
    }
  } catch (error) {
    if ((error as { name?: string }).name === "PasswordException") {
      throw new ApiError(422, `"${displayName}" is password-protected. Please upload an unprotected PDF.`);
    }
    console.error("[cv] PDF parsing failed", { name: (error as Error).name, message: (error as Error).message });
    throw new ApiError(422, `"${displayName}" could not be read as a PDF.`);
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
