import { z } from "zod";
import { DECISIONS, PLATFORMS } from "@/lib/workflow/constants";
import { STAGE_COUNT } from "@/lib/workflow/stages";

const id = z.string().trim().min(1).max(64);

export const roleCreateSchema = z.object({
  name: z.string().trim().min(1, "is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export const stageNumberSchema = z.coerce.number().int().min(1).max(STAGE_COUNT);

export const stageSaveSchema = z.object({
  roleId: id,
  stageNumber: stageNumberSchema,
  input: z.string().max(100_000).optional(),
  candidateIds: z.array(id).max(50).optional(),
});

export const generateSchema = z.object({
  roleId: id,
  stageNumber: stageNumberSchema,
  input: z.string().max(100_000).optional().default(""),
  candidateIds: z.array(id).max(20).optional(),
});

export const sourcingProfileCreateSchema = z.object({
  roleId: id,
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

export const sourcingAnalyzeSchema = z.object({
  roleId: id,
  profileIds: z.array(id).max(30).optional(),
});

export const rescoreSchema = z.object({
  roleId: id,
  candidateId: id,
});

export const trackerUpdateSchema = z
  .object({
    roleId: id,
    decision: z.enum(DECISIONS).optional(),
    recruiterNotes: z.string().max(20_000).optional(),
  })
  .refine((v) => v.decision !== undefined || v.recruiterNotes !== undefined, "Nothing to update.");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "is required").max(128),
  newPassword: z.string().min(8, "must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(128),
});
