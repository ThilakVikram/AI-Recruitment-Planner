/** Recruitment constants and helpers (safe for client and server). */
import { KICKOFF_TOPICS } from "./kickoff";

export const RECRUITMENT_STATUSES = ["Open", "In progress", "On hold", "Completed", "Cancelled"] as const;
export type RecruitmentStatus = (typeof RECRUITMENT_STATUSES)[number];

/** 1 → "001"; numbers past 999 simply grow ("1000"). */
export function recruitmentSlug(id: number): string {
  return String(id).padStart(3, "0");
}

export function recruitmentCode(id: number): string {
  return `REC-${recruitmentSlug(id)}`;
}

/** Accepts "001" or "1"; returns null for anything that isn't a positive integer. */
export function parseRecruitmentSlug(slug: string): number | null {
  if (!/^\d{1,9}$/.test(slug)) return null;
  const id = Number(slug);
  return id > 0 ? id : null;
}

export const SECTION_KEYS = ["kickoff", "market-research", "sourcing"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionDefinition = {
  key: SectionKey;
  title: string;
  description: string;
  produces: string[];
  /** Sections that must be generated first. */
  requires: SectionKey[];
  inputLabel: string;
  inputPlaceholder: string;
  /** Minimum characters of free-text input, when the input is mandatory. */
  inputMin?: number;
};

/** The AI sections of a recruitment (outreach, screening and final decision messages are written per applicant). */
export const SECTIONS: SectionDefinition[] = [
  {
    key: "kickoff",
    title: "Job Management",
    description: "Turns the kick-off meeting notes into the job description, scorecard and job posts. The JD is what CVs are scored against.",
    produces: ["Job Description", "Role Scorecard", "LinkedIn Job Post", "Naukri Job Post", "Other channel posts"],
    requires: [],
    inputLabel: "Extra instructions (optional)",
    inputPlaceholder: "The kick-off notes list is used automatically. Add anything else, e.g. “keep the JD under 400 words”.",
  },
  {
    key: "market-research",
    title: "Market research",
    description:
      "Plan where and how to find this talent, based on the kick-off output. Not externally verified — treat as a working hypothesis.",
    produces: ["Sourcing plan", "Talent market map", "Target companies", "Target candidate profiles", "Market observations", "Sourcing channels"],
    requires: ["kickoff"],
    inputLabel: "Additional market context (optional)",
    inputPlaceholder: "Anything you already know: competitor companies, salary benchmarks, locations to focus on, companies to avoid…",
  },
  {
    key: "sourcing",
    title: "Sourcing strategy",
    description:
      "Generate a sourcing strategy with Boolean strings, and analyse LinkedIn / Naukri profiles you paste in. Reference URLs are never fetched.",
    produces: ["Sourcing & channel strategy", "Boolean search strings", "Target profile characteristics", "Ranked profile shortlist"],
    requires: ["kickoff"],
    inputLabel: "Sourcing focus (optional)",
    inputPlaceholder: "e.g. focus on Chennai and Bengaluru, exclude current clients, prioritise D2C eCommerce backgrounds…",
  },
];

export function getSection(key: string): SectionDefinition | undefined {
  return SECTIONS.find((s) => s.key === key);
}

export const RECRUITMENT_CV_MAX_FILES = 10;

/** First step of the recruitment page. Not an AI section: every AI section unlocks once it has notes. */
export const NOTES_STEP = {
  key: "notes",
  title: "Kick-off meeting notes",
  description:
    "Capture the hiring manager kick-off meeting — fill in the form topic by topic, or paste the full notes and let AI fill the form. Every later section builds on these; Job Management turns them into the JD, scorecard and job posts.",
  produces: KICKOFF_TOPICS.map((t) => t.label),
} as const;

export type StepKey = typeof NOTES_STEP.key | SectionKey;

/** AI outputs written for one applicant, from the applicant panel. */
export const APPLICANT_OUTPUT_KINDS = ["outreach", "screening", "final-decision"] as const;
export type ApplicantOutputKind = (typeof APPLICANT_OUTPUT_KINDS)[number];
