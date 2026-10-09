import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const kickoffNotesPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Role: {roleName}

<notes>
{input}
</notes>

These are a recruiter's raw notes from the kick-off meeting with the hiring manager. Fill in the kick-off form from them: responsibilities, skills (must-have and nice-to-have as short tags), experience/location/salary, and team/interview process.

Rules:
- Use only information in the notes. Do not add requirements, numbers or details from the role details or general knowledge.
- Keep the recruiter's facts and wording where possible.
- Put each fact in the single most specific field; use a topic's "notes" field only for things that don't fit its other fields.
- Leave a field empty (empty string, empty list or null) when the notes don't cover it.`,
  ],
]);
