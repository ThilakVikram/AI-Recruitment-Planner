import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM, CONTEXT_TEMPLATE } from "./shared";

export const sourcingStrategyPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 3. Sourcing

${CONTEXT_TEMPLATE}

<recruiter_input>
{input}
</recruiter_input>

Produce a practical sourcing pack:
## Sourcing Strategy
## Channel Strategy (LinkedIn, Naukri, referrals, communities, others — what to do on each)
## Boolean Search Strings
Provide ready-to-paste strings in code blocks: at least 3 for LinkedIn (Recruiter / basic search), at least 2 for Naukri Resdex (keywords + must-have / exclude), and 1–2 Google X-ray strings. Use proper AND / OR / NOT, quotes and parentheses.
## Target Profile Characteristics (must-have signals, nice-to-have signals, red flags)
## Outreach Prioritisation (which profiles to contact first)`,
  ],
]);
