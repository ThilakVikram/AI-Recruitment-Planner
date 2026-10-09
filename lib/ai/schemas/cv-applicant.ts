import { z } from "zod";
import { cvScoreSchema } from "./cv-score";

const optional = (max: number, what: string) =>
  z.string().trim().max(max).describe(`${what} exactly as written in the CV, or an empty string if not present.`);

/**
 * CV score plus the applicant details needed to create a talent-pool record.
 * Every extracted field must come from the CV text — never inferred.
 */
export const cvApplicantSchema = cvScoreSchema.extend({
  email: optional(255, "Candidate's email address"),
  phone: optional(50, "Candidate's phone number"),
  location: optional(200, "Candidate's current city / location"),
  currentTitle: optional(200, "Candidate's most recent job title"),
  currentCompany: optional(200, "Candidate's most recent employer"),
  experienceYears: z
    .number()
    .min(0)
    .max(60)
    .nullable()
    .describe("Total years of professional experience if stated or clearly computable from the CV's dates, otherwise null."),
  skills: z.array(z.string().trim().min(1).max(60)).max(25).describe("Key skills explicitly listed or evidenced in the CV."),
  linkedinUrl: optional(2048, "LinkedIn profile URL"),
});

export type CvApplicantRaw = z.infer<typeof cvApplicantSchema>;
