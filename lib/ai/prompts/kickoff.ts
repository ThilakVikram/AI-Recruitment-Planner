import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM } from "./shared";

export const kickoffPrompt = ChatPromptTemplate.fromMessages([
  ["system", BASE_SYSTEM],
  [
    "human",
    `Current stage: 1. Kick-off

Role: {roleName}

<notes>
{input}
</notes>

From the kick-off meeting notes above, produce:
1. jobDescription — a complete job description (about the role, responsibilities, must-have requirements, nice-to-have, experience, location/work mode, what we offer). Include only requirements supported by the notes or the requisition details above (the notes win if they conflict); mark unspecified items as "To be confirmed".
2. scorecard — a role scorecard as a markdown table: competency/outcome, must-have or nice-to-have, what good looks like, how it will be assessed. Base every row on the notes.
3. linkedinPost — an engaging LinkedIn job post (with a few relevant hashtags).
4. naukriPost — a Naukri post with job title, experience range, CTC (or "Not disclosed"), location, key skills and a concise description.
5. otherPosts — up to 3 other channel posts only where genuinely useful for this role (e.g. employee referral message, WhatsApp/Instagram blurb).
6. openQuestions — important details missing from the notes that the recruiter should confirm.`,
  ],
]);
