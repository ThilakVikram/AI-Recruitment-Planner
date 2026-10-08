import { z } from "zod";
import { PLATFORMS, PROFILE_VERDICTS } from "@/lib/workflow/constants";

const bullet = z.string().trim().min(1).max(500);

export const profileAnalysisSchema = z.object({
  candidateName: z.string().trim().min(1).max(200),
  platform: z.enum(PLATFORMS),
  fitScore: z.number().int().min(0).max(10).describe("Fit score out of 10."),
  platformSignals: z
    .array(bullet)
    .max(8)
    .describe("Signals specific to the platform, e.g. LinkedIn: headline, tenure, endorsements, activity; Naukri: notice period, current/expected CTC, last active, key skills."),
  strengths: z.array(bullet).max(6),
  concerns: z.array(bullet).max(6),
  verdict: z.enum(PROFILE_VERDICTS).describe("Reach out (score ≥ 7), Hold (5–6), Pass (≤ 4)."),
  reason: z.string().trim().min(1).max(800),
});

export type ProfileAnalysis = z.infer<typeof profileAnalysisSchema>;
