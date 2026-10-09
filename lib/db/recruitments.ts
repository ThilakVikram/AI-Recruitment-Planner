import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import { normalizeName } from "@/lib/validation/normalize";
import type { SectionKey } from "@/lib/recruitment/constants";
import type { Decision, FinalDecision } from "@/lib/workflow/constants";

export async function listRecruitments({ status, q }: { status?: string; q?: string }) {
  const where: Prisma.RecruitmentWhereInput = {};
  if (status) where.status = status;
  if (q) {
    const asNumber = Number(q.replace(/^rec-?/i, ""));
    where.OR = [
      { summary: { contains: q } },
      { role: { name: { contains: q } } },
      ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ id: asNumber }] : []),
    ];
  }
  return prisma.recruitment.findMany({
    where,
    include: {
      role: { select: { id: true, name: true, status: true, location: true, openings: true } },
      createdBy: { select: { name: true } },
      _count: { select: { applications: true, sections: { where: { output: { not: null } } } } },
      applications: { select: { score: true }, orderBy: { score: { sort: "desc", nulls: "last" } }, take: 1 },
    },
    orderBy: { id: "desc" },
  });
}

export async function countRecruitmentsByStatus() {
  const rows = await prisma.recruitment.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}

export async function countRecruitmentsForRole(roleId: string) {
  return prisma.recruitment.count({ where: { roleId } });
}

/** Returns null when the role doesn't exist. Openings default to the role's. */
export async function createRecruitment(data: { roleId: string; summary: string; openings?: number }, createdById: string) {
  const role = await prisma.role.findUnique({ where: { id: data.roleId }, select: { openings: true } });
  if (!role) return null;
  return prisma.recruitment.create({ data: { ...data, openings: data.openings ?? role.openings, createdById }, select: { id: true } });
}

/** The applicant fields an application DTO needs (see toApplicationDTO). */
const applicationInclude = {
  applicant: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      location: true,
      currentTitle: true,
      currentCompany: true,
      experienceYears: true,
      skills: true,
      linkedinUrl: true,
      portfolioUrl: true,
      source: true,
    },
  },
  cvFile: { select: { id: true, originalFileName: true } },
} satisfies Prisma.RecruitmentApplicationInclude;

/** Everything the 3-column recruitment page needs. Applications are ranked by score. */
export async function getRecruitmentWorkspace(id: number) {
  return prisma.recruitment.findUnique({
    where: { id },
    include: {
      role: true,
      createdBy: { select: { name: true } },
      sections: true,
      profiles: { orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }] },
      applications: {
        include: applicationInclude,
        orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
      },
    },
  });
}

export type RecruitmentWorkspace = NonNullable<Awaited<ReturnType<typeof getRecruitmentWorkspace>>>;

/** Every recruitment an applicant is part of (newest first), with what the applicant detail page needs. */
export async function getApplicantApplications(applicantId: string) {
  const apps = await prisma.recruitmentApplication.findMany({
    where: { applicantId },
    include: {
      ...applicationInclude,
      recruitment: {
        select: {
          id: true,
          status: true,
          role: { select: { id: true, name: true } },
          // Job Management output — outreach and screening need it.
          sections: { where: { key: "kickoff", output: { not: null } }, select: { id: true } },
          _count: { select: { applications: true } },
        },
      },
    },
    orderBy: { recruitmentId: "desc" },
  });
  // Rank within each recruitment, the same order as its Applicants list (score, then first added).
  const ranks = await Promise.all(
    apps.map((a) =>
      a.score === null
        ? null
        : prisma.recruitmentApplication.count({
            where: { recruitmentId: a.recruitmentId, OR: [{ score: { gt: a.score } }, { score: a.score, createdAt: { lt: a.createdAt } }] },
          }),
    ),
  );
  return apps.map((a, i) => ({ ...a, rank: ranks[i] === null ? undefined : ranks[i]! + 1 }));
}

export async function getRecruitmentWithRole(id: number) {
  return prisma.recruitment.findUnique({ where: { id }, include: { role: true } });
}

export async function recruitmentExists(id: number) {
  return (await prisma.recruitment.findUnique({ where: { id }, select: { id: true } })) !== null;
}

export async function updateRecruitment(id: number, data: { summary?: string; status?: string; openings?: number }) {
  const result = await prisma.recruitment.updateMany({ where: { id }, data });
  return result.count > 0;
}

/** Deletes the recruitment, its AI sections, profiles and applications. Applicants and their CVs are kept. */
export async function deleteRecruitment(id: number) {
  const result = await prisma.recruitment.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function saveKickoffNotes(recruitmentId: number, data: { fields: Prisma.InputJsonValue; raw: string }) {
  const result = await prisma.recruitment.updateMany({
    where: { id: recruitmentId },
    data: { kickoffFields: data.fields, kickoffRaw: data.raw || null },
  });
  return result.count > 0;
}

export async function getRecruitmentSections(recruitmentId: number) {
  const rows = await prisma.recruitmentSection.findMany({ where: { recruitmentId } });
  return new Map(rows.map((r) => [r.key as SectionKey, r]));
}

export async function saveRecruitmentSection(
  recruitmentId: number,
  key: SectionKey,
  data: { input: string; inputData?: Prisma.InputJsonValue; output: string; outputData?: Prisma.InputJsonValue },
) {
  return prisma.recruitmentSection.upsert({
    where: { recruitmentId_key: { recruitmentId, key } },
    create: { recruitmentId, key, ...data },
    update: data,
  });
}

/** Applications (with CV text) for the candidate-based AI sections, scoped to this recruitment. */
export async function getApplicationsForPrompt(recruitmentId: number, applicationIds: string[]) {
  return prisma.recruitmentApplication.findMany({
    where: { recruitmentId, id: { in: applicationIds } },
    include: {
      applicant: { select: { fullName: true } },
      cvFile: { select: { extractedText: true } },
    },
    orderBy: { score: { sort: "desc", nulls: "last" } },
  });
}

export async function updateApplication(recruitmentId: number, applicationId: string, data: { decision?: Decision; screeningNotes?: string; finalDecision?: FinalDecision | null }) {
  const { screeningNotes, ...rest } = data;
  const result = await prisma.recruitmentApplication.updateMany({
    where: { id: applicationId, recruitmentId },
    data: { ...rest, ...(screeningNotes !== undefined ? { screeningNotes: screeningNotes || null } : {}) },
  });
  return result.count > 0;
}

/** Stores one of the applicant panel's AI outputs (outreach, screening report, final decision messages). */
export async function saveApplicationOutput(
  recruitmentId: number,
  applicationId: string,
  field: "outreachMessages" | "screeningReport" | "finalDecisionMessages",
  value: Prisma.InputJsonValue,
) {
  const result = await prisma.recruitmentApplication.updateMany({ where: { id: applicationId, recruitmentId }, data: { [field]: value } });
  return result.count > 0;
}

/** Removes an application from this recruitment only — the applicant and CV stay in the talent pool. */
export async function deleteApplication(recruitmentId: number, applicationId: string) {
  const result = await prisma.recruitmentApplication.deleteMany({ where: { id: applicationId, recruitmentId } });
  return result.count > 0;
}

export type ScoredCvInput = {
  recruitmentId: number;
  roleId: string;
  createdById: string;
  /** Where the applicant came from (new applicants only), e.g. "CV upload", "LinkedIn". */
  source: string;
  /** Kind of the stored document, e.g. "CV", or "Other" for a pasted profile. */
  fileKind: string;
  file: { originalFileName: string; mimeType: string; sizeBytes: number; fileHash: string; bytes: Uint8Array; extractedText: string };
  profile: {
    fullName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    currentTitle: string | null;
    currentCompany: string | null;
    experienceYears: number | null;
    skills: string[];
    linkedinUrl: string | null;
  };
  score: { score: number; category: string; summary: string; strengths: string[]; gaps: string[] };
};

/**
 * Saves one scored CV:
 * 1. Finds the applicant — same file (hash) → same email → same name already in this recruitment — or creates one.
 *    Existing applicants only get blank fields filled in; recruiter-entered details are never overwritten.
 * 2. Stores the CV on the applicant (deduplicated by hash).
 * 3. Upserts the application score. The recruiter's decision is preserved on rescoring.
 */
export async function saveScoredApplication(input: ScoredCvInput) {
  const { recruitmentId, roleId, createdById, source, fileKind, file, profile, score } = input;
  const normalizedName = normalizeName(profile.fullName);

  return prisma.$transaction(async (tx) => {
    const byHash = await tx.applicantFile.findFirst({ where: { fileHash: file.fileHash }, select: { applicantId: true } });
    const byEmail = !byHash && profile.email ? await tx.applicant.findFirst({ where: { email: profile.email }, select: { id: true } }) : null;
    const byName =
      !byHash && !byEmail
        ? await tx.recruitmentApplication.findFirst({
            where: { recruitmentId, applicant: { normalizedName } },
            select: { applicantId: true },
          })
        : null;
    let applicantId = byHash?.applicantId ?? byEmail?.id ?? byName?.applicantId ?? null;
    const isNewApplicant = applicantId === null;

    if (applicantId) {
      const existing = await tx.applicant.findUniqueOrThrow({ where: { id: applicantId } });
      const fill = <T,>(current: T | null, next: T | null) => (current === null || current === "" ? next : current);
      await tx.applicant.update({
        where: { id: applicantId },
        data: {
          email: fill(existing.email, profile.email),
          phone: fill(existing.phone, profile.phone),
          location: fill(existing.location, profile.location),
          currentTitle: fill(existing.currentTitle, profile.currentTitle),
          currentCompany: fill(existing.currentCompany, profile.currentCompany),
          experienceYears: existing.experienceYears ?? profile.experienceYears,
          linkedinUrl: fill(existing.linkedinUrl, profile.linkedinUrl),
          skills: Array.isArray(existing.skills) && existing.skills.length ? undefined : profile.skills,
          roleId: existing.roleId ?? roleId,
        },
      });
    } else {
      const created = await tx.applicant.create({
        data: {
          ...profile,
          normalizedName,
          source,
          status: "New",
          roleId,
          createdById,
        },
        select: { id: true },
      });
      applicantId = created.id;
    }

    const { bytes, ...fileMeta } = file;
    const cv = await tx.applicantFile.upsert({
      where: { applicantId_fileHash: { applicantId, fileHash: file.fileHash } },
      create: { applicantId, kind: fileKind, ...fileMeta, data: bytes as Uint8Array<ArrayBuffer> },
      update: { extractedText: file.extractedText },
      select: { id: true },
    });

    const scoring = { ...score, cvFileId: cv.id, scoredAt: new Date() };
    const application = await tx.recruitmentApplication.upsert({
      where: { recruitmentId_applicantId: { recruitmentId, applicantId } },
      create: { recruitmentId, applicantId, ...scoring },
      update: scoring,
      select: { id: true },
    });
    await tx.recruitment.update({ where: { id: recruitmentId }, data: { updatedAt: new Date() } });

    return { applicationId: application.id, applicantId, isNewApplicant };
  });
}

// ── Profile analysis (pasted LinkedIn / Naukri profiles) ─────────────────────

export async function listRecruitmentProfiles(recruitmentId: number) {
  return prisma.recruitmentProfile.findMany({
    where: { recruitmentId },
    orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

export async function createRecruitmentProfile(
  recruitmentId: number,
  data: { candidateName: string; platform: string; referenceUrl: string | null; profileText: string },
) {
  return prisma.recruitmentProfile.create({
    data: { recruitmentId, ...data, normalizedName: normalizeName(data.candidateName) },
  });
}

export async function getRecruitmentProfile(recruitmentId: number, profileId: string) {
  return prisma.recruitmentProfile.findFirst({ where: { id: profileId, recruitmentId } });
}

export async function saveRecruitmentProfileAnalysis(profileId: string, data: { analysis: Prisma.InputJsonValue; score: number; verdict: string }) {
  return prisma.recruitmentProfile.update({ where: { id: profileId }, data });
}

export async function deleteRecruitmentProfile(recruitmentId: number, profileId: string) {
  const result = await prisma.recruitmentProfile.deleteMany({ where: { id: profileId, recruitmentId } });
  return result.count > 0;
}

/** The analysed profile for an applicant (matched by name), used to personalise outreach. */
export async function findRecruitmentProfileByName(recruitmentId: number, name: string) {
  return prisma.recruitmentProfile.findFirst({
    where: { recruitmentId, normalizedName: normalizeName(name) },
    orderBy: { updatedAt: "desc" },
  });
}

/** Marks a profile as added to the applicants (the profile is kept). */
export async function linkProfileToApplicant(recruitmentId: number, profileId: string, applicantId: string) {
  return prisma.recruitmentProfile.updateMany({ where: { id: profileId, recruitmentId }, data: { applicantId } });
}
