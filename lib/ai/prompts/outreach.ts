import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const outreachPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 5. Outreach

Role: {roleName}

<job_description>
{jobDescription}
</job_description>

<scorecard>
{scorecard}
</scorecard>

<candidate>
Name: {candidateName}
Assessment score: {score}
Assessment summary: {summary}
Strengths: {strengths}
</candidate>

<sourcing_profile>
{sourcingInfo}
</sourcing_profile>

<cv>
{cvText}
</cv>

<recruiter_instructions>
{input}
</recruiter_instructions>

Write personalised outreach for this candidate:
### LinkedIn InMail (subject + message, under 150 words)
### Email (subject + message)
### WhatsApp / short follow-up (under 60 words)

Personalise using only facts present in the CV or sourcing profile. Do not mention scores, internal assessments or other candidates. Never invent experience.`,
  ],
]);
