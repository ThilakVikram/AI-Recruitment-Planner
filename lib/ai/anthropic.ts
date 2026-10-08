import "server-only";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIError, AI_MESSAGES } from "./errors";

let cached: { key: string; model: ChatAnthropic } | null = null;

/**
 * The single, shared server-side Claude model used by every chain.
 * Configured from ANTHROPIC_API_KEY / ANTHROPIC_MODEL; nothing is hard-coded.
 *
 * No sampling parameters (temperature/top_p) and no `thinking` override are sent:
 * current Claude models reject them, and each model's defaults are used instead.
 */
export function getChatModel(): ChatAnthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const modelName = process.env.ANTHROPIC_MODEL?.trim();
  if (!apiKey) throw new AIError(500, AI_MESSAGES.missingKey);
  if (!modelName) throw new AIError(500, AI_MESSAGES.missingModel);

  const cacheKey = `${modelName}:${apiKey.slice(-6)}`;
  if (cached?.key === cacheKey) return cached.model;

  const model = new ChatAnthropic({
    model: modelName,
    apiKey,
    maxTokens: 16_000,
    // Retries are handled once, by the Anthropic SDK (429 / 5xx / network, with backoff).
    maxRetries: 0,
    clientOptions: { maxRetries: 2, timeout: 5 * 60 * 1000 },
  });
  cached = { key: cacheKey, model };
  return model;
}
