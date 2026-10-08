import "server-only";
import type { CandidateListItem } from "@/lib/db/candidates";
import type { StageRecord } from "@/lib/db/stages";
import type { listSourcingProfiles } from "@/lib/db/sourcing";
import { STAGES } from "./stages";
import type { CandidateDTO, ProfileAnalysisDTO, SourcingProfileDTO, StageDTO } from "./types";

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export function toStageDTOs(rows: StageRecord[]): StageDTO[] {
  const byNumber = new Map(rows.map((r) => [r.stageNumber, r]));
  return STAGES.map(({ number }) => {
    const r = byNumber.get(number);
    const inputData = r?.inputData as { candidateIds?: unknown } | null | undefined;
    return {
      stageNumber: number,
      input: r?.input ?? "",
      candidateIds: strings(inputData?.candidateIds),
      output: r?.output ?? "",
      updatedAt: r?.output ? r.updatedAt.toISOString() : null,
    };
  });
}

export function toCandidateDTO(c: CandidateListItem): CandidateDTO {
  return {
    id: c.id,
    name: c.name,
    source: c.source,
    score: c.score,
    category: c.category,
    summary: c.summary,
    strengths: strings(c.strengths),
    gaps: strings(c.gaps),
    decision: c.tracker?.decision ?? "Pending",
    recruiterNotes: c.tracker?.recruiterNotes ?? "",
    cvFileNames: c.cvs.map((cv) => cv.originalFileName),
    scoredAt: c.scoredAt?.toISOString() ?? null,
  };
}

export function toSourcingProfileDTO(p: Awaited<ReturnType<typeof listSourcingProfiles>>[number]): SourcingProfileDTO {
  const a = p.analysis as Partial<ProfileAnalysisDTO> | null;
  return {
    id: p.id,
    candidateName: p.candidateName,
    platform: p.platform,
    referenceUrl: p.referenceUrl,
    profileText: p.profileText,
    score: p.score,
    verdict: p.verdict,
    analysis: a
      ? {
          fitScore: Number(a.fitScore ?? p.score ?? 0),
          platformSignals: strings(a.platformSignals),
          strengths: strings(a.strengths),
          concerns: strings(a.concerns),
          verdict: String(a.verdict ?? p.verdict ?? ""),
          reason: String(a.reason ?? ""),
        }
      : null,
  };
}
