import "server-only";
import { sourcingStrategyPrompt } from "../prompts/sourcing";
import { runTextChain } from "../run";

/** Stage 3 without profiles: strategy, channels, Boolean strings, target characteristics. */
export async function runSourcingStrategyChain(args: { roleName: string; previousContext: string; input: string }) {
  return runTextChain(sourcingStrategyPrompt, { ...args, input: args.input || "None." });
}
