import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const finalDecisionPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 7. Final Decision — candidate communication

Role: {roleName}

<candidate>
Name: {candidateName}
Role-relevant strengths: {strengths}
Areas that were less aligned with this role: {gaps}
</candidate>

<recruiter_instructions>
{input}
</recruiter_instructions>

Write a candidate-facing message for {candidateName}, who will not be moving forward for this role.
### Rejection Email (subject + message)
### Constructive Feedback (2–4 kind, specific, actionable points the candidate could develop)

This text will be sent to the candidate, so:
- Do not mention scores, rankings, categories, other candidates, internal notes, internal discussions or how the decision was made.
- Do not include anything confidential about the company or the hiring process.
- Be respectful, warm and concise; thank them for their time.`,
  ],
]);
