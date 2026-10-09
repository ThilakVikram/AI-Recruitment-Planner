/** Applicant domain constants (safe for client and server). */

export const APPLICANT_STATUSES = ["New", "Screening", "Interviewing", "Offered", "Hired", "Rejected", "On hold"] as const;
export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];

export const APPLICANT_FILE_KINDS = ["CV", "Cover letter", "Certificate", "Portfolio", "ID proof", "Other"] as const;
export type ApplicantFileKind = (typeof APPLICANT_FILE_KINDS)[number];

export const APPLICANT_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const APPLICANT_FILES_PER_UPLOAD = 5;

/** Extension → MIME type of every accepted applicant document. */
export const APPLICANT_FILE_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
} as const;
export type ApplicantFileExtension = keyof typeof APPLICANT_FILE_TYPES;

/** Value for an <input type="file" accept>. */
export const APPLICANT_FILE_ACCEPT = Object.keys(APPLICANT_FILE_TYPES).map((ext) => `.${ext}`).join(",");

export const APPLICANT_PAGE_SIZE = 25;

export type MetadataEntry = { key: string; value: string };
