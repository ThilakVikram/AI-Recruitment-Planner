import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const profileAnalyzerPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 3. Sourcing — profile analysis

<job_description>
{jobDescription}
</job_description>

<scorecard>
{scorecard}
</scorecard>

Candidate name (as entered by the recruiter): {candidateName}
Platform: {platform}

<profile>
{profileText}
</profile>

Assess this {platform} profile against the role. Only use what is written in the profile text — do not assume skills or experience that are not stated, and never refer to the URL. Return:
- candidateName and platform
- fitScore out of 10
- platformSignals relevant to {platform}
- strengths and concerns (evidence-based)
- verdict: "Reach out" (7–10), "Hold" (5–6) or "Pass" (0–4)
- reason (2–3 sentences)`,
  ],
]);
