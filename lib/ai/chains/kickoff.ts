import "server-only";
import { kickoffPrompt } from "../prompts/kickoff";
import { kickoffOutputSchema, renderKickoffMarkdown, type KickoffOutput } from "../schemas/kickoff";
import { runStructuredChain } from "../run";

export async function runKickoffChain(args: { roleName: string; input: string }) {
  const data: KickoffOutput = await runStructuredChain(kickoffPrompt, kickoffOutputSchema, "kickoff_documents", args);
  return { markdown: renderKickoffMarkdown(data), data };
}
