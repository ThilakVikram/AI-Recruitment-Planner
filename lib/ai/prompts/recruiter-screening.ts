import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const recruiterScreeningPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 6. Recruiter Screening

Role: {roleName}

<scorecard>
{scorecard}
</scorecard>

<candidate>
Name: {candidateName}
CV assessment score: {score} ({category})
CV assessment summary: {summary}
</candidate>

<cv>
{cvText}
</cv>

<notes>
{input}
</notes>

Write an internal recruiter screening report with exactly these sections:
## Candidate Overview
## Relevant Experience
## Strengths
## Concerns
## Scorecard Alignment (table: scorecard item, evidence from CV/interview, rating Strong / Partial / Not evidenced)
## Interview Observations
## Recommendation (Proceed / Hold / Reject, with rationale)
## Follow-up Questions (for the next interview round)

Base every statement on the CV and the interview notes; clearly mark anything not covered.`,
  ],
]);
