import { z } from "zod";
import { DECISIONS, PLATFORMS, FINAL_DECISIONS } from "@/lib/workflow/constants";
import { APPLICANT_FILE_KINDS, APPLICANT_STATUSES } from "@/lib/applicants/constants";
import { EMPLOYMENT_TYPES, ROLE_PRIORITIES, ROLE_STATUSES, WORK_MODES } from "@/lib/roles/constants";
import { APPLICANT_OUTPUT_KINDS, RECRUITMENT_STATUSES, SECTION_KEYS } from "@/lib/recruitment/constants";

const id = z.string().trim().min(1).max(64);

/** Trimmed optional text where "" means "clear the field". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "must start with http:// or https://")
  .nullish()
  .transform((v) => v || null);

/** "" or a value from the list; "" / missing become null. */
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.literal(""), z.enum(values)])
    .nullish()
    .transform((v) => (v || null) as T[number] | null);

const skillList = z.array(z.string().trim().min(1).max(60)).max(50).default([]);

const years = z.number().int().min(0).max(60).nullish().transform((v) => v ?? null);

/**
 * Full role (requisition) record — used for create (POST) and full replace (PUT).
 * Everything except the name is optional so the quick "New role" dialog can send just name + description.
 */
export const roleSchema = z
  .object({
    name: z.string().trim().min(1, "is required").max(200),
    description: optionalText(5000),
    department: optionalText(100),
    location: optionalText(200),
    workMode: optionalEnum(WORK_MODES),
    employmentType: optionalEnum(EMPLOYMENT_TYPES),
    openings: z.number().int().min(1).max(999).default(1),
    experienceMin: years,
    experienceMax: years,
    salaryRange: optionalText(100),
    hiringManager: optionalText(200),
    targetDate: z
      .union([z.literal(""), z.iso.date()])
      .nullish()
      .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
    priority: z.enum(ROLE_PRIORITIES).default("Medium"),
    status: z.enum(ROLE_STATUSES).default("Open"),
    requiredSkills: skillList,
    niceToHaveSkills: skillList,
  })
  .refine((r) => r.experienceMin === null || r.experienceMax === null || r.experienceMin <= r.experienceMax, {
    message: "minimum experience cannot be more than the maximum",
    path: ["experienceMin"],
  });

/** A LinkedIn / Naukri profile pasted into a recruitment (the URL is never fetched). */
export const recruitmentProfileCreateSchema = z.object({
  platform: z.enum(PLATFORMS),
  candidateName: z.string().trim().min(1, "is required").max(200),
  referenceUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "must start with http:// or https://")
    .optional()
    .nullable(),
  profileText: z.string().trim().min(20, "must be at least 20 characters").max(50_000),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "is required").max(128),
  newPassword: z.string().min(8, "must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(128),
});

/** Full applicant record — used for both create (POST) and full replace (PUT). */
export const applicantSchema = z.object({
  fullName: z.string().trim().min(1, "is required").max(200),
  email: z
    .union([z.literal(""), z.email().max(255)])
    .nullish()
    .transform((v) => v?.toLowerCase() || null),
  phone: optionalText(50),
  location: optionalText(200),
  currentTitle: optionalText(200),
  currentCompany: optionalText(200),
  experienceYears: z.number().min(0).max(60).nullish().transform((v) => v ?? null),
  noticePeriod: optionalText(100),
  currentCtc: optionalText(100),
  expectedCtc: optionalText(100),
  source: optionalText(100),
  status: z.enum(APPLICANT_STATUSES).default("New"),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  skills: skillList,
  metadata: z
    .array(z.object({ key: z.string().trim().min(1, "needs a name").max(100), value: z.string().trim().max(1000) }))
    .max(30)
    .default([]),
  notes: optionalText(20_000),
  roleId: id.nullish().transform((v) => v ?? null),
});

export const applicantFileKindSchema = z.enum(APPLICANT_FILE_KINDS);

export const recruitmentIdSchema = z.coerce.number().int().positive().max(999_999_999);

export const recruitmentCreateSchema = z.object({
  roleId: id,
  /** Optional — can be added later from the recruitment page. */
  summary: z.string().trim().max(5000).optional().default(""),
  /** Defaults to the role's openings. */
  openings: z.number().int().min(1).max(999).optional(),
});

/** Partial update of the recruitment header (summary, status and/or openings). */
export const recruitmentUpdateSchema = z
  .object({
    summary: z.string().trim().max(5000).optional(),
    status: z.enum(RECRUITMENT_STATUSES).optional(),
    openings: z.number().int().min(1).max(999).optional(),
  })
  .refine((v) => v.summary !== undefined || v.status !== undefined || v.openings !== undefined, "Nothing to update.");

const kText = (max: number) => z.string().trim().max(max).default("");
const kList = (maxItems: number, maxLen: number) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).default([]);
const kYears = z.number().int().min(0).max(60).nullable().default(null);

/** The structured kick-off form (see lib/recruitment/kickoff.ts). */
export const kickoffFormSchema = z
  .object({
    responsibilities: z.object({ items: kList(30, 500), outcomes: kText(5000), notes: kText(10_000) }),
    skills: z.object({ mustHave: kList(50, 60), niceToHave: kList(50, 60), notes: kText(10_000) }),
    experience: z.object({
      minYears: kYears,
      maxYears: kYears,
      location: kText(200),
      workMode: z.union([z.literal(""), z.enum(WORK_MODES)]).default(""),
      salaryRange: kText(100),
      noticePeriod: kText(100),
      notes: kText(10_000),
    }),
    team: z.object({ teamSize: kText(100), reportsTo: kText(200), interviewRounds: kList(15, 300), timeline: kText(500), notes: kText(10_000) }),
  })
  .refine((f) => f.experience.minYears === null || f.experience.maxYears === null || f.experience.minYears <= f.experience.maxYears, {
    message: "minimum experience cannot be more than the maximum",
    path: ["experience", "minYears"],
  });

export const recruitmentKickoffSchema = z.object({
  fields: kickoffFormSchema,
  raw: z.string().max(100_000),
});

export const recruitmentKickoffExtractSchema = z.object({
  raw: z.string().trim().min(20, "must be at least 20 characters").max(100_000),
});

export const recruitmentGenerateSchema = z.object({
  section: z.enum(SECTION_KEYS),
  input: z.string().max(100_000).optional().default(""),
});

export const recruitmentApplicationUpdateSchema = z
  .object({
    decision: z.enum(DECISIONS).optional(),
    screeningNotes: z.string().trim().max(100_000).optional(),
    /** null clears it. */
    finalDecision: z.enum(FINAL_DECISIONS).nullable().optional(),
  })
  .refine((v) => v.decision !== undefined || v.screeningNotes !== undefined || v.finalDecision !== undefined, "Nothing to update.");

export const recruitmentApplicantGenerateSchema = z.object({
  kind: z.enum(APPLICANT_OUTPUT_KINDS),
  input: z.string().max(100_000).optional().default(""),
});

