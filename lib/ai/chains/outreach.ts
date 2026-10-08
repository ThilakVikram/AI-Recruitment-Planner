import "server-only";
import { outreachPrompt } from "../prompts/outreach";
import { runTextChain } from "../run";

export async function runOutreachChain(args: {
  roleName: string;
  jobDescription: string;
  scorecard: string;
  candidateName: string;
  score: string;
  summary: string;
  strengths: string;
  sourcingInfo: string;
  cvText: string;
  input: string;
}) {
  return runTextChain(outreachPrompt, { ...args, input: args.input || "None." });
}
