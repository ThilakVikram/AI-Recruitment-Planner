import "server-only";
import { profileAnalyzerPrompt } from "../prompts/profile-analyzer";
import { profileAnalysisSchema, type ProfileAnalysis } from "../schemas/profile-analysis";
import { runStructuredChain } from "../run";
import { PROFILE_VERDICTS, type Platform, type ProfileVerdict } from "@/lib/workflow/constants";

function verdictForScore(score: number): ProfileVerdict {
  if (score >= 7) return PROFILE_VERDICTS[0];
  if (score >= 5) return PROFILE_VERDICTS[1];
  return PROFILE_VERDICTS[2];
}

/**
 * Analyses one pasted profile. Only the pasted text is used — the reference URL is
 * deliberately not passed to the model and is never fetched.
 */
export async function runProfileAnalyzerChain(args: {
  jobDescription: string;
  scorecard: string;
  candidateName: string;
  platform: Platform;
  profileText: string;
}): Promise<ProfileAnalysis> {
  const result = await runStructuredChain(profileAnalyzerPrompt, profileAnalysisSchema, "profile_analysis", args);
  // The recruiter-entered name and platform are authoritative; verdict must agree with the score.
  return {
    ...result,
    candidateName: args.candidateName,
    platform: args.platform,
    verdict: verdictForScore(result.fitScore),
  };
}
