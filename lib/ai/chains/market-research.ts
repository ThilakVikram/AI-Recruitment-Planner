import "server-only";
import { marketResearchPrompt } from "../prompts/market-research";
import { runTextChain } from "../run";

export async function runMarketResearchChain(args: { roleName: string; previousContext: string; input: string }) {
  return runTextChain(marketResearchPrompt, { ...args, input: args.input || "None." });
}
