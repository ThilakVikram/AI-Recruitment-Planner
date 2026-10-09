import { z } from "zod";

/**
 * Structured AI outputs (market research, sourcing, outreach, screening, final decision), so the
 * recruitment page can show each part in its own tab — like the Job Management.
 * The prompts are the same; each field holds one of the sections the prompt asks for.
 */
const md = (section: string) => z.string().min(1).describe(`The “${section}” section in GitHub-flavoured markdown, without its heading.`);

export const marketResearchSchema = z.object({
  disclaimer: z.string().min(1).describe("One-line note that this is an unverified working hypothesis based on general knowledge."),
  sourcingPlan: md("Sourcing Plan"),
  talentMarketMap: md("Talent Market Map"),
  targetCompanies: md("Target Companies (markdown table: company, why relevant, likely titles)"),
  targetCandidateProfiles: md("Target Candidate Profiles (2–4 personas)"),
  marketObservations: md("Market Observations"),
  sourcingChannels: md("Sourcing Channels (ranked, with how to use each)"),
});

export const sourcingSchema = z.object({
  sourcingStrategy: md("Sourcing Strategy"),
  channelStrategy: md("Channel Strategy"),
  booleanStrings: md("Boolean Search Strings (each ready-to-paste string in its own fenced code block)"),
  targetProfileCharacteristics: md("Target Profile Characteristics (must-have signals, nice-to-have signals, red flags)"),
  outreachPrioritisation: md("Outreach Prioritisation"),
});

export const outreachSchema = z.object({
  linkedinInMail: md("LinkedIn InMail (subject + message, under 150 words)"),
  email: md("Email (subject + message)"),
  whatsapp: md("WhatsApp / short follow-up (under 60 words)"),
});

export const screeningSchema = z.object({
  candidateOverview: md("Candidate Overview"),
  relevantExperience: md("Relevant Experience"),
  strengths: md("Strengths"),
  concerns: md("Concerns"),
  scorecardAlignment: md("Scorecard Alignment (markdown table: scorecard item, evidence from CV/interview, rating Strong / Partial / Not evidenced)"),
  interviewObservations: md("Interview Observations"),
  recommendation: z.enum(["Proceed", "Hold", "Reject"]).describe("The overall recommendation."),
  recommendationRationale: md("Recommendation rationale"),
  followUpQuestions: md("Follow-up Questions for the next interview round"),
});

export const finalDecisionSchema = z.object({
  rejectionEmail: md("Rejection Email (subject + message)"),
  constructiveFeedback: md("Constructive Feedback (2–4 kind, specific, actionable points)"),
});

export type MarketResearchOutput = z.infer<typeof marketResearchSchema>;
export type SourcingOutput = z.infer<typeof sourcingSchema>;
export type OutreachOutput = z.infer<typeof outreachSchema>;
export type ScreeningOutput = z.infer<typeof screeningSchema>;
export type FinalDecisionOutput = z.infer<typeof finalDecisionSchema>;

/** Stored outputData for sections written per applicant. */
export type PerApplicant<T> = { applicants: ({ applicationId: string; name: string } & T)[] };
