import "server-only";
import { recruiterScreeningPrompt } from "../prompts/recruiter-screening";
import { runTextChain } from "../run";

export async function runRecruiterScreeningChain(args: {
  roleName: string;
  scorecard: string;
  candidateName: string;
  score: string;
  category: string;
  summary: string;
  cvText: string;
  input: string;
}) {
  return runTextChain(recruiterScreeningPrompt, args);
}
