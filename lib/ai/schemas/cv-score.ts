import { z } from "zod";
import { FIT_CATEGORIES } from "@/lib/workflow/constants";

const bullet = z.string().trim().min(1).max(600);

/** Shape requested from the model and validated server-side before saving. */
export const cvScoreSchema = z.object({
  candidateName: z
    .string()
    .trim()
    .max(200)
    .describe("Candidate's full name exactly as written in the CV, or an empty string if not present."),
  score: z.number().int().min(0).max(100).describe("Overall fit score from 0 to 100."),
  category: z
    .enum(FIT_CATEGORIES)
    .describe("85–100 Strong Fit, 70–84 Good Fit, 50–69 Average Fit, 0–49 Not Fit. Must match the score."),
  summary: z.string().trim().min(1).max(2000).describe("2–4 sentence evidence-based assessment."),
  strengths: z.array(bullet).max(8).describe("Evidence-backed strengths relevant to the role."),
  gaps: z.array(bullet).max(8).describe("Missing or weak requirements versus the JD/scorecard."),
});

export type CvScoreRaw = z.infer<typeof cvScoreSchema>;
export type CvScore = Omit<CvScoreRaw, "candidateName">;
