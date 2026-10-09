import "server-only";
import { cvAssessmentPrompt } from "../prompts/cv-assessment";
import { cvApplicantSchema, type CvApplicantRaw } from "../schemas/cv-applicant";
import { runStructuredChain } from "../run";
import { categoryForScore } from "@/lib/workflow/constants";

/**
 * Scores one CV against the job description and extracts the applicant's
 * contact and profile details. Category is re-derived from the score.
 */
export async function runCvApplicantChain(args: {
  jobDescription: string;
  scorecard: string;
  fileName: string;
  cvText: string;
}): Promise<CvApplicantRaw> {
  const result = await runStructuredChain(cvAssessmentPrompt, cvApplicantSchema, "cv_assessment_with_profile", args);
  return { ...result, category: categoryForScore(result.score) };
}
