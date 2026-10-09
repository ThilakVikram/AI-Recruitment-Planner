import "server-only";
import { marketResearchPrompt } from "../prompts/market-research";
import { sourcingStrategyPrompt } from "../prompts/sourcing";
import { outreachPrompt } from "../prompts/outreach";
import { recruiterScreeningPrompt } from "../prompts/recruiter-screening";
import { finalDecisionPrompt } from "../prompts/final-decision";
import { runStructuredChain } from "../run";
import { finalDecisionSchema, marketResearchSchema, outreachSchema, screeningSchema, sourcingSchema } from "../schemas/recruitment-sections";

/**
 * Structured AI sections (market research, sourcing, and the per-applicant outreach, screening and
 * final decision messages). The recruitment page shows each returned field in its own tab.
 */
type Vars = Record<string, string>;
const orNone = (vars: Vars) => ({ ...vars, input: vars.input || "None." });

export const runMarketResearchStructured = (vars: { roleName: string; previousContext: string; input: string }) =>
  runStructuredChain(marketResearchPrompt, marketResearchSchema, "market_research", orNone(vars));

export const runSourcingStructured = (vars: { roleName: string; previousContext: string; input: string }) =>
  runStructuredChain(sourcingStrategyPrompt, sourcingSchema, "sourcing_pack", orNone(vars));

export const runOutreachStructured = (vars: {
  roleName: string;
  jobDescription: string;
  scorecard: string;
  candidateName: string;
  score: string;
  summary: string;
  strengths: string;
  sourcingInfo: string;
  cvText: string;
  input: string;
}) => runStructuredChain(outreachPrompt, outreachSchema, "outreach_messages", orNone(vars));

export const runScreeningStructured = (vars: {
  roleName: string;
  scorecard: string;
  candidateName: string;
  score: string;
  category: string;
  summary: string;
  cvText: string;
  input: string;
}) => runStructuredChain(recruiterScreeningPrompt, screeningSchema, "screening_report", vars);

/** Candidate-facing: scores, decisions and recruiter notes are deliberately not among the inputs. */
export const runFinalDecisionStructured = (vars: { roleName: string; candidateName: string; strengths: string; gaps: string; input: string }) =>
  runStructuredChain(finalDecisionPrompt, finalDecisionSchema, "candidate_message", orNone(vars));
