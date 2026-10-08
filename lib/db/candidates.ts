import "server-only";
import { prisma } from "./prisma";
import type { CvScore } from "@/lib/ai/schemas/cv-score";
import type { Decision } from "@/lib/workflow/constants";

const candidateListSelect = {
  id: true,
  name: true,
  source: true,
  score: true,
  category: true,
  summary: true,
  strengths: true,
  gaps: true,
  scoredAt: true,
  updatedAt: true,
  tracker: { select: { decision: true, recruiterNotes: true, updatedAt: true } },
  cvs: { select: { originalFileName: true, createdAt: true }, orderBy: { createdAt: "desc" as const } },
} as const;

/** All candidates of a role, ranked by score (highest first). */
export async function listCandidates(roleId: string) {
  return prisma.candidate.findMany({
    where: { roleId },
    select: candidateListSelect,
    orderBy: [{ score: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  });
}

export type CandidateListItem = Awaited<ReturnType<typeof listCandidates>>[number];

/** A single candidate scoped to a role, with the latest CV text (server-side use only). */
export async function getCandidateWithLatestCv(roleId: string, candidateId: string) {
  return prisma.candidate.findFirst({
    where: { id: candidateId, roleId },
    include: {
      tracker: true,
      cvs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getCandidatesWithLatestCv(roleId: string, candidateIds: string[]) {
  return prisma.candidate.findMany({
    where: { roleId, id: { in: candidateIds } },
    include: { tracker: true, cvs: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ score: { sort: "desc", nulls: "last" } }],
  });
}

/**
 * Finds an existing candidate in the same role for an uploaded CV.
 * Order: identical file (hash) → same normalised candidate name → same normalised file name.
 */
export async function findDuplicateCandidate(
  roleId: string,
  keys: { fileHash: string; normalizedName?: string; normalizedFileName?: string },
): Promise<string | null> {
  const byHash = await prisma.candidateCV.findFirst({
    where: { fileHash: keys.fileHash, candidate: { roleId } },
    select: { candidateId: true },
  });
  if (byHash) return byHash.candidateId;

  if (keys.normalizedName) {
    const byName = await prisma.candidate.findFirst({
      where: { roleId, normalizedName: keys.normalizedName },
      select: { id: true },
    });
    if (byName) return byName.id;
  }

  if (keys.normalizedFileName) {
    const byFile = await prisma.candidateCV.findFirst({
      where: { normalizedFileName: keys.normalizedFileName, candidate: { roleId } },
      select: { candidateId: true },
    });
    if (byFile) return byFile.candidateId;
  }
  return null;
}

type CvInput = {
  originalFileName: string;
  normalizedFileName: string;
  fileType: string;
  fileHash: string;
  extractedText: string;
};

function scoringData(score: CvScore) {
  return {
    score: score.score,
    category: score.category,
    summary: score.summary,
    strengths: score.strengths,
    gaps: score.gaps,
    scoredAt: new Date(),
  };
}

/**
 * Saves a scored CV.
 *
 * Tracker merge rule: scoring fields (score, category, summary, strengths, gaps) are
 * updated, but the tracker's `decision` and `recruiterNotes` are NEVER overwritten.
 * A tracker row is only created (as "Pending") when the candidate does not have one yet.
 */
export async function saveScoredCv(
  roleId: string,
  args: {
    existingCandidateId: string | null;
    name: string;
    normalizedName: string;
    source: string;
    score: CvScore;
    cv: CvInput;
  },
) {
  return prisma.$transaction(async (tx) => {
    let candidateId = args.existingCandidateId;
    let isNew = false;

    if (candidateId) {
      // Re-check role ownership inside the transaction.
      const existing = await tx.candidate.findFirst({ where: { id: candidateId, roleId }, select: { id: true } });
      if (!existing) candidateId = null;
    }

    if (candidateId) {
      await tx.candidate.update({ where: { id: candidateId }, data: scoringData(args.score) });
    } else {
      const created = await tx.candidate.create({
        data: {
          roleId,
          name: args.name,
          normalizedName: args.normalizedName,
          source: args.source,
          ...scoringData(args.score),
        },
        select: { id: true },
      });
      candidateId = created.id;
      isNew = true;
    }

    await tx.candidateCV.upsert({
      where: { candidateId_fileHash: { candidateId, fileHash: args.cv.fileHash } },
      create: { candidateId, ...args.cv },
      update: {
        originalFileName: args.cv.originalFileName,
        normalizedFileName: args.cv.normalizedFileName,
        extractedText: args.cv.extractedText,
      },
    });

    // `update: {}` — rescoring must never touch decision / recruiterNotes.
    await tx.candidateTracker.upsert({
      where: { candidateId },
      create: { candidateId, decision: "Pending" },
      update: {},
    });

    return { candidateId, isNew };
  });
}

/** Rescore an existing candidate. Same merge rule: tracker fields are untouched. */
export async function updateCandidateScore(roleId: string, candidateId: string, score: CvScore) {
  const result = await prisma.candidate.updateMany({
    where: { id: candidateId, roleId },
    data: scoringData(score),
  });
  return result.count > 0;
}

/** Recruiter-driven tracker update (decision and/or notes) for a candidate in a role. */
export async function updateTracker(
  roleId: string,
  candidateId: string,
  data: { decision?: Decision; recruiterNotes?: string },
) {
  const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, roleId }, select: { id: true } });
  if (!candidate) return null;
  return prisma.candidateTracker.upsert({
    where: { candidateId },
    create: { candidateId, decision: data.decision ?? "Pending", recruiterNotes: data.recruiterNotes ?? null },
    update: data,
    select: { decision: true, recruiterNotes: true, updatedAt: true },
  });
}

export async function deleteCandidate(roleId: string, candidateId: string): Promise<boolean> {
  const result = await prisma.candidate.deleteMany({ where: { id: candidateId, roleId } });
  return result.count > 0;
}
