import { z } from "zod";

export const kickoffOutputSchema = z.object({
  jobDescription: z.string().min(1).describe("Full job description in markdown."),
  scorecard: z
    .string()
    .min(1)
    .describe("Role scorecard in markdown: outcomes, must-have and nice-to-have competencies with how each will be assessed."),
  linkedinPost: z.string().min(1).describe("LinkedIn job post (markdown)."),
  naukriPost: z.string().min(1).describe("Naukri job post (markdown) with key skills, experience and CTC fields."),
  otherPosts: z
    .array(z.object({ channel: z.string().min(1), post: z.string().min(1) }))
    .max(4)
    .describe("Other channel-specific posts that suit this role (e.g. Instagram/WhatsApp/employee referral), only if relevant."),
  openQuestions: z
    .array(z.string())
    .max(10)
    .describe("Information missing from the kick-off notes that the recruiter should confirm with the hiring manager."),
});

export type KickoffOutput = z.infer<typeof kickoffOutputSchema>;

export function renderKickoffMarkdown(o: KickoffOutput): string {
  const parts = [
    `## 1. Job Description\n\n${o.jobDescription}`,
    `## 2. Role Scorecard\n\n${o.scorecard}`,
    `## 3. LinkedIn Job Post\n\n${o.linkedinPost}`,
    `## 4. Naukri Job Post\n\n${o.naukriPost}`,
  ];
  if (o.otherPosts.length) {
    parts.push(`## 5. Other Channel Posts\n\n${o.otherPosts.map((p) => `### ${p.channel}\n\n${p.post}`).join("\n\n")}`);
  }
  if (o.openQuestions.length) {
    parts.push(`## Open Questions for the Hiring Manager\n\n${o.openQuestions.map((q) => `- ${q}`).join("\n")}`);
  }
  return parts.join("\n\n---\n\n");
}
