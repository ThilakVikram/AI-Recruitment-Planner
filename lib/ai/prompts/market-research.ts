import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM, CONTEXT_TEMPLATE } from "./shared";

export const marketResearchPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 2. Market Research

${CONTEXT_TEMPLATE}

<recruiter_input>
{input}
</recruiter_input>

Using the kick-off output above (and the recruiter's input, if any), produce a market research brief with these sections:
## Sourcing Plan
## Talent Market Map (where this talent sits: industries, company types, cities in India, seniority bands)
## Target Companies (a table: company, why relevant, likely titles to look for). Base suggestions on general industry knowledge and label them as suggestions to validate.
## Target Candidate Profiles (2–4 personas)
## Market Observations (supply/demand, compensation and notice-period considerations — clearly marked as general observations, not verified data)
## Sourcing Channels (ranked, with how to use each)

Start the brief with a one-line note that this is an unverified working hypothesis based on general knowledge.`,
  ],
]);
