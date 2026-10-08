import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const cvAssessmentPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 4. CV Assessment

<job_description>
{jobDescription}
</job_description>

<scorecard>
{scorecard}
</scorecard>

<cv file="{fileName}">
{cvText}
</cv>

Score this CV against the job description and scorecard. The job description is authoritative: if the scorecard conflicts with it or covers different requirements, follow the job description. A candidate missing any must-have requirement in the job description cannot be a Strong Fit.
- score: integer 0–100 reflecting overall fit, weighting must-have requirements most heavily.
- category must match the score exactly: 85–100 "Strong Fit", 70–84 "Good Fit", 50–69 "Average Fit", 0–49 "Not Fit".
- candidateName: as written in the CV (empty string if absent).
- summary: 2–4 sentences, evidence-based.
- strengths and gaps: concise bullets citing evidence from the CV. If a requirement is not mentioned in the CV, list it as a gap ("Not evidenced in CV") rather than assuming.`,
  ],
]);
