/** Static definitions of the seven workflow stages (safe for client and server). */
export type StageDefinition = {
  number: number;
  key: string;
  title: string;
  description: string;
  produces: string[];
  inputLabel: string;
  inputPlaceholder: string;
};

export const STAGES: StageDefinition[] = [
  {
    number: 1,
    key: "kickoff",
    title: "Kick-off",
    description:
      "Capture the hiring manager kick-off meeting and turn it into the core hiring documents for this role.",
    produces: ["Job Description", "Role Scorecard", "LinkedIn Job Post", "Naukri Job Post", "Other channel posts"],
    inputLabel: "Kick-off meeting notes",
    inputPlaceholder:
      "Paste the kick-off notes: responsibilities, must-have skills, nice-to-haves, experience, location / hybrid policy, salary band, team, reporting line, interview process…",
  },
  {
    number: 2,
    key: "market-research",
    title: "Market Research",
    description:
      "Plan where and how to find this talent, based on the kick-off output. Not externally verified — treat as a working hypothesis.",
    produces: ["Sourcing plan", "Talent market map", "Target companies", "Target candidate profiles", "Market observations", "Sourcing channels"],
    inputLabel: "Additional market context (optional)",
    inputPlaceholder: "Anything you already know: competitor companies, salary benchmarks, locations to focus on, companies to avoid…",
  },
  {
    number: 3,
    key: "sourcing",
    title: "Sourcing",
    description:
      "Generate a sourcing strategy with Boolean strings, and analyse LinkedIn / Naukri profiles you paste in. Reference URLs are never fetched.",
    produces: ["Sourcing & channel strategy", "Boolean search strings", "Target profile characteristics", "Ranked profile shortlist"],
    inputLabel: "Sourcing focus (optional)",
    inputPlaceholder: "e.g. focus on Chennai and Bengaluru, exclude current clients, prioritise D2C eCommerce backgrounds…",
  },
  {
    number: 4,
    key: "cv-assessment",
    title: "CV Assessment",
    description:
      "Upload CVs (PDF or TXT). Each CV is scored 0–100 against the job description and scorecard, then ranked.",
    produces: ["Score / 100 per candidate", "Fit category", "Summary, strengths and gaps", "Ranked candidate list"],
    inputLabel: "Job description used for scoring",
    inputPlaceholder: "Auto-filled from the Stage 1 job description. Edit if needed before scoring.",
  },
  {
    number: 5,
    key: "outreach",
    title: "Outreach",
    description: "Write personalised outreach messages grounded in the candidate's CV, score and the role.",
    produces: ["Personalised LinkedIn / email / WhatsApp outreach"],
    inputLabel: "Outreach instructions (optional)",
    inputPlaceholder: "e.g. keep it under 120 words, mention hybrid work, invite for a 20-minute call this week…",
  },
  {
    number: 6,
    key: "recruiter-screening",
    title: "Recruiter Screening",
    description: "Turn your screening-call notes into a structured screening report against the scorecard.",
    produces: [
      "Candidate overview",
      "Relevant experience",
      "Strengths & concerns",
      "Scorecard alignment",
      "Interview observations",
      "Recommendation",
      "Follow-up questions",
    ],
    inputLabel: "Screening interview notes",
    inputPlaceholder: "Paste your notes from the screening call…",
  },
  {
    number: 7,
    key: "final-decision",
    title: "Final Decision",
    description:
      "Draft candidate-facing rejection messages with constructive feedback. Internal notes and decision-making are never included.",
    produces: ["Personalised rejection messages", "Constructive feedback"],
    inputLabel: "Tone / extra instructions (optional)",
    inputPlaceholder: "e.g. warm and brief, invite them to apply for future roles…",
  },
];

export const STAGE_COUNT = STAGES.length;

export function getStage(stageNumber: number): StageDefinition {
  const stage = STAGES.find((s) => s.number === stageNumber);
  if (!stage) throw new Error(`Unknown stage ${stageNumber}`);
  return stage;
}
