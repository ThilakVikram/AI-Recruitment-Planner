/** Serializable shapes for analysed LinkedIn / Naukri profiles (recruitment profile analysis). */
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
