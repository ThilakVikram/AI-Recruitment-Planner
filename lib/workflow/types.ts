/** Serializable shapes passed from Server Components to the workflow/tracker client components. */
export type StageDTO = {
  stageNumber: number;
  input: string;
  candidateIds: string[];
  output: string;
  updatedAt: string | null;
};

export type CandidateDTO = {
  id: string;
  name: string;
  source: string | null;
  score: number | null;
  category: string | null;
  summary: string | null;
  strengths: string[];
  gaps: string[];
  decision: string;
  recruiterNotes: string;
  cvFileNames: string[];
  scoredAt: string | null;
};

export type ProfileAnalysisDTO = {
  fitScore: number;
  platformSignals: string[];
  strengths: string[];
  concerns: string[];
  verdict: string;
  reason: string;
};

export type SourcingProfileDTO = {
  id: string;
  candidateName: string;
  platform: string;
  referenceUrl: string | null;
  profileText: string;
  score: number | null;
  verdict: string | null;
  analysis: ProfileAnalysisDTO | null;
};
