import "server-only";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { z } from "zod";
import { getChatModel } from "./anthropic";
import { AIError, AI_MESSAGES, toAIError } from "./errors";

type Vars = Record<string, string>;

/** prompt → Claude → markdown text */
export async function runTextChain(prompt: ChatPromptTemplate, vars: Vars): Promise<string> {
  const model = getChatModel();
  try {
    const text = await prompt.pipe(model).pipe(new StringOutputParser()).invoke(vars);
    if (!text.trim()) throw new AIError(502, AI_MESSAGES.parse);
    return text.trim();
  } catch (error) {
    throw toAIError(error);
  }
}

/**
 * prompt → Claude (native JSON-schema structured output) → Zod-validated object.
 * The response is validated again server-side before anything is saved.
 */
export async function runStructuredChain<S extends z.ZodType>(
  prompt: ChatPromptTemplate,
  schema: S,
  name: string,
  vars: Vars,
): Promise<z.infer<S>> {
  const model = getChatModel();
  let raw: unknown;
  try {
    raw = await prompt.pipe(model.withStructuredOutput(schema, { name, method: "jsonSchema" })).invoke(vars);
  } catch (error) {
    throw toAIError(error);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AIError(502, AI_MESSAGES.parse, { cause: parsed.error });
  }
  return parsed.data;
}

/** Runs async work over items with a small concurrency cap (keeps us under rate limits). */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
