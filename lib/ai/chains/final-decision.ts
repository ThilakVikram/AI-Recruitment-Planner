import "server-only";
import { finalDecisionPrompt } from "../prompts/final-decision";
import { runTextChain } from "../run";

/**
 * Candidate-facing rejection + feedback. Recruiter notes, decisions, scores and
 * screening reports are intentionally NOT passed to this chain.
 */
export async function runFinalDecisionChain(args: {
  roleName: string;
  candidateName: string;
  strengths: string;
  gaps: string;
  input: string;
}) {
  return runTextChain(finalDecisionPrompt, { ...args, input: args.input || "None." });
}
