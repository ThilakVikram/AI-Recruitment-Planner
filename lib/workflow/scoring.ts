import "server-only";
import { ApiError } from "@/lib/api/errors";
import { AIError } from "@/lib/ai/errors";
import { loadRoleContext } from "@/lib/ai/context";
import { mapWithConcurrency } from "@/lib/ai/run";
import { runCvAssessmentChain } from "@/lib/ai/chains/cv-assessment";
import { findDuplicateCandidate, getCandidateWithLatestCv, saveScoredCv, updateCandidateScore } from "@/lib/db/candidates";
import { extractCvText } from "@/lib/cv/extract";
import type { ValidatedCvFile } from "@/lib/cv/file";
import { normalizeName } from "@/lib/validation/normalize";
import type { CvScore, CvScoreRaw } from "@/lib/ai/schemas/cv-score";

export type CvScoreResult =
  | { fileName: string; ok: true; candidateId: string; candidateName: string; score: number; category: string; isNew: boolean }
  | { fileName: string; ok: false; error: string };

async function requireJd(roleId: string) {
  const ctx = await loadRoleContext(roleId, 4);
  if (!ctx.hasJobDescription) {
    throw new ApiError(400, "No job description yet. Generate Stage 1 or enter a JD in Stage 4 before scoring CVs.");
  }
  return ctx;
}

/** Keeps the name as written, except ALL-CAPS headers ("ARUN KUMAR") which are title-cased. */
function displayName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed.toLowerCase().replace(/(^|[\s'.-])\p{L}/gu, (m) => m.toUpperCase());
}

function withoutName(result: CvScoreRaw): CvScore {
  return { score: result.score, category: result.category, summary: result.summary, strengths: result.strengths, gaps: result.gaps };
}

function nameFromFile(normalizedFileName: string): string {
  const cleaned = normalizedFileName.replace(/\b(cv|resume|curriculum vitae|updated|final|latest)\b/gi, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase()) : "Unnamed candidate";
}

/**
 * Stage 4 pipeline for each file: extract text → score with the JD + scorecard →
 * validate → identify/create candidate → save CV → merge tracker (decision/notes preserved).
 * Files are processed independently so one bad CV does not fail the batch.
 */
export async function scoreCvFiles(roleId: string, files: ValidatedCvFile[]): Promise<CvScoreResult[]> {
  const ctx = await requireJd(roleId);

  return mapWithConcurrency(files, 3, async (file): Promise<CvScoreResult> => {
    try {
      const cvText = await extractCvText(file.bytes, file.fileType, file.originalFileName);
      const result = await runCvAssessmentChain({
        jobDescription: ctx.jobDescription,
        scorecard: ctx.scorecard,
        fileName: file.originalFileName,
        cvText,
      });

      const name = displayName(result.candidateName) || nameFromFile(file.normalizedFileName);
      const normalizedName = normalizeName(name);
      const existingCandidateId = await findDuplicateCandidate(roleId, {
        fileHash: file.fileHash,
        normalizedName: result.candidateName.trim() ? normalizedName : undefined,
        normalizedFileName: file.normalizedFileName,
      });

      const score = withoutName(result);
      const saved = await saveScoredCv(roleId, {
        existingCandidateId,
        name,
        normalizedName,
        source: "CV upload",
        score,
        cv: {
          originalFileName: file.originalFileName,
          normalizedFileName: file.normalizedFileName,
          fileType: file.fileType,
          fileHash: file.fileHash,
          extractedText: cvText,
        },
      });

      return {
        fileName: file.originalFileName,
        ok: true,
        candidateId: saved.candidateId,
        candidateName: name,
        score: score.score,
        category: score.category,
        isNew: saved.isNew,
      };
    } catch (error) {
      if (error instanceof ApiError || error instanceof AIError) {
        if (error instanceof AIError) console.error("[score] AI error", { file: file.originalFileName, message: error.message, cause: (error.cause as Error)?.message });
        return { fileName: file.originalFileName, ok: false, error: error.message };
      }
      console.error("[score] Unexpected error", { file: file.originalFileName, message: (error as Error)?.message });
      return { fileName: file.originalFileName, ok: false, error: "Scoring failed. Please try again." };
    }
  });
}

/** Re-runs scoring for an existing candidate from their latest stored CV. Tracker fields are untouched. */
export async function rescoreCandidate(roleId: string, candidateId: string) {
  const candidate = await getCandidateWithLatestCv(roleId, candidateId);
  if (!candidate) throw new ApiError(404, "Candidate not found in this role.");
  const cv = candidate.cvs[0];
  if (!cv) throw new ApiError(400, "This candidate has no CV on file to rescore.");

  const ctx = await requireJd(roleId);
  const result = await runCvAssessmentChain({
    jobDescription: ctx.jobDescription,
    scorecard: ctx.scorecard,
    fileName: cv.originalFileName,
    cvText: cv.extractedText,
  });
  const score = withoutName(result);
  await updateCandidateScore(roleId, candidateId, score);
  return { candidateId, score: score.score, category: score.category };
}
