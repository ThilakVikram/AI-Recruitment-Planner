/** AI failure with a user-safe message. The original error is kept for server-side logging only. */
export class AIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AIError";
  }
}

export const AI_MESSAGES = {
  missingKey: "Anthropic API key is missing.",
  missingModel: "Anthropic model is not configured. Set ANTHROPIC_MODEL on the server.",
  invalidKey: "Anthropic API key was rejected. Please check ANTHROPIC_API_KEY.",
  rateLimited: "Anthropic rate limit reached. Please wait a minute and try again.",
  overloaded: "Anthropic is temporarily overloaded. Please try again shortly.",
  parse: "Unable to parse AI response.",
  failed: "AI generation failed. Please try again.",
} as const;

/** Maps LangChain / Anthropic SDK errors to user-safe AIErrors. */
export function toAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;
  const e = error as { status?: number; name?: string; lc_error_code?: string; message?: string };
  const status = typeof e?.status === "number" ? e.status : undefined;

  if (status === 401 || e?.lc_error_code === "MODEL_AUTHENTICATION") {
    return new AIError(502, AI_MESSAGES.invalidKey, { cause: error });
  }
  if (status === 429 || e?.lc_error_code === "MODEL_RATE_LIMIT") {
    return new AIError(429, AI_MESSAGES.rateLimited, { cause: error });
  }
  if (status === 529 || status === 503) {
    return new AIError(503, AI_MESSAGES.overloaded, { cause: error });
  }
  if (
    e?.name === "OutputParserException" ||
    e?.name === "ZodError" ||
    e?.name === "SyntaxError" ||
    e?.lc_error_code === "OUTPUT_PARSING_FAILURE"
  ) {
    return new AIError(502, AI_MESSAGES.parse, { cause: error });
  }
  return new AIError(502, AI_MESSAGES.failed, { cause: error });
}
