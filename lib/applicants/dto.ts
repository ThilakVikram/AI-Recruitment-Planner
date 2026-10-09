import type { MetadataEntry } from "./constants";

/** Shapes shared between the applicant pages, components and API responses. */
export type ApplicantFileDTO = {
  id: string;
  kind: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ApplicantFormValues = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  experienceYears: string;
  noticePeriod: string;
  currentCtc: string;
  expectedCtc: string;
  source: string;
  status: string;
  linkedinUrl: string;
  portfolioUrl: string;
  skills: string[];
  metadata: MetadataEntry[];
  notes: string;
  roleId: string;
};

export function toFileDTO(f: { id: string; kind: string; originalFileName: string; mimeType: string; sizeBytes: number; createdAt: Date }): ApplicantFileDTO {
  return { ...f, createdAt: f.createdAt.toISOString() };
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function asMetadata(value: unknown): MetadataEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is MetadataEntry => typeof v === "object" && v !== null && typeof v.key === "string" && typeof v.value === "string",
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
