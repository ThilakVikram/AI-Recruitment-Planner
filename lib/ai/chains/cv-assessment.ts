import "server-only";
import { cvAssessmentPrompt } from "../prompts/cv-assessment";
import { cvScoreSchema, type CvScoreRaw } from "../schemas/cv-score";
import { runStructuredChain } from "../run";
import { categoryForScore } from "@/lib/workflow/constants";

/**
 * Scores one CV. The schema is validated server-side and the category is
 * re-derived from the score so the two can never disagree.
 */
export async function runCvAssessmentChain(args: {
  jobDescription: string;
  scorecard: string;
  fileName: string;
  cvText: string;
}): Promise<CvScoreRaw> {
  const result = await runStructuredChain(cvAssessmentPrompt, cvScoreSchema, "cv_assessment", args);
  const category = categoryForScore(result.score);
  if (category !== result.category) {
    console.warn(`[cv-assessment] model category "${result.category}" did not match score ${result.score}; using "${category}"`);
  }
  return { ...result, category };
}
