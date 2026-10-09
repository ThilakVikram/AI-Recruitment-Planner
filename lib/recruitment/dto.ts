import type { SourcingProfileDTO } from "@/lib/workflow/types";
import type { SectionKey } from "./constants";

/** Serializable shapes passed from the recruitment page to its client components. */

export type RecruitmentSectionDTO = {
  key: SectionKey;
  input: string;
  output: string;
  /** Structured output (outputData) — turned into tabs by sectionGroups(). */
  data: unknown;
  updatedAt: string;
};

export type RecruitmentApplicationDTO = {
  id: string;
  applicantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  experienceYears: number | null;
  skills: string[];
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  source: string | null;
  score: number | null;
  category: string | null;
  summary: string | null;
  strengths: string[];
  gaps: string[];
  decision: string;
  /** Recruiter's interview screening notes (used by Recruiter screening). */
  screeningNotes: string;
  /** Per-applicant AI outputs (structured + generatedAt), rendered by applicantOutputGroup(). */
  outreachMessages: unknown;
  screeningReport: unknown;
  finalDecisionMessages: unknown;
  finalDecision: string | null;
  cvFileId: string | null;
  cvFileName: string | null;
  scoredAt: string | null;
};

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function toSectionDTO(s: { key: string; input: string | null; output: string | null; outputData: unknown; updatedAt: Date }): RecruitmentSectionDTO {
  return {
    key: s.key as SectionKey,
    input: s.input ?? "",
    output: s.output ?? "",
    data: s.outputData ?? null,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toApplicationDTO(a: {
  id: string;
  applicantId: string;
  score: number | null;
  category: string | null;
  summary: string | null;
  strengths: unknown;
  gaps: unknown;
  decision: string;
  screeningNotes: string | null;
  outreachMessages: unknown;
  screeningReport: unknown;
  finalDecisionMessages: unknown;
  finalDecision: string | null;
  scoredAt: Date | null;
  applicant: {
    fullName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    currentTitle: string | null;
    currentCompany: string | null;
    experienceYears: unknown;
    skills: unknown;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    source: string | null;
  };
  cvFile: { id: string; originalFileName: string } | null;
}): RecruitmentApplicationDTO {
  const { applicant } = a;
  return {
    id: a.id,
    applicantId: a.applicantId,
    name: applicant.fullName,
    email: applicant.email,
    phone: applicant.phone,
    headline: [applicant.currentTitle, applicant.currentCompany].filter(Boolean).join(" at ") || null,
    location: applicant.location,
    currentTitle: applicant.currentTitle,
    currentCompany: applicant.currentCompany,
    experienceYears: applicant.experienceYears === null ? null : Number(applicant.experienceYears),
    skills: strings(applicant.skills),
    linkedinUrl: applicant.linkedinUrl,
    portfolioUrl: applicant.portfolioUrl,
    source: applicant.source,
    score: a.score,
    category: a.category,
    summary: a.summary,
    strengths: strings(a.strengths),
    gaps: strings(a.gaps),
    decision: a.decision,
    screeningNotes: a.screeningNotes ?? "",
    outreachMessages: a.outreachMessages ?? null,
    screeningReport: a.screeningReport ?? null,
    finalDecisionMessages: a.finalDecisionMessages ?? null,
    finalDecision: a.finalDecision,
    cvFileId: a.cvFile?.id ?? null,
    cvFileName: a.cvFile?.originalFileName ?? null,
    scoredAt: a.scoredAt?.toISOString() ?? null,
  };
}


/** An analysed LinkedIn / Naukri profile (rendered by the shared profile card) plus the applicant it became, if any. */
export type RecruitmentProfileDTO = SourcingProfileDTO & { applicantId: string | null };

export function toProfileDTO(p: {
  id: string;
  candidateName: string;
  platform: string;
  referenceUrl: string | null;
  profileText: string;
  score: number | null;
  verdict: string | null;
  analysis: unknown;
  applicantId: string | null;
}): RecruitmentProfileDTO {
  return {
    id: p.id,
    candidateName: p.candidateName,
    platform: p.platform,
    referenceUrl: p.referenceUrl,
    profileText: p.profileText,
    score: p.score,
    verdict: p.verdict,
    analysis: p.analysis && typeof p.analysis === "object" ? (p.analysis as SourcingProfileDTO["analysis"]) : null,
    applicantId: p.applicantId,
  };
}
