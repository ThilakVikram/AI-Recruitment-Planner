import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import { normalizeName } from "@/lib/validation/normalize";
import { APPLICANT_PAGE_SIZE, type ApplicantFileKind } from "@/lib/applicants/constants";
import type { applicantSchema } from "@/lib/validation/requests";
import type { z } from "zod";

export type ApplicantInput = z.output<typeof applicantSchema>;

/** File metadata only — the stored bytes are fetched separately for downloads. */
const fileMetaSelect = {
  id: true,
  kind: true,
  originalFileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
} as const;

function toData(input: ApplicantInput) {
  return { ...input, normalizedName: normalizeName(input.fullName) };
}

export async function listApplicants({ q, status, roleId, page }: { q?: string; status?: string; roleId?: string; page: number }) {
  const where: Prisma.ApplicantWhereInput = {};
  if (status) where.status = status;
  if (roleId) where.roleId = roleId;
  if (q) {
    const term = q.trim();
    where.OR = [
      { normalizedName: { contains: normalizeName(term) } },
      { email: { contains: term.toLowerCase() } },
      { phone: { contains: term } },
      { currentTitle: { contains: term } },
      { currentCompany: { contains: term } },
      { location: { contains: term } },
      { skills: { array_contains: [term] } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.applicant.count({ where }),
    prisma.applicant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        location: true,
        currentTitle: true,
        currentCompany: true,
        experienceYears: true,
        status: true,
        skills: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
        files: { select: { kind: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * APPLICANT_PAGE_SIZE,
      take: APPLICANT_PAGE_SIZE,
    }),
  ]);
  return { total, rows };
}

export async function countApplicants() {
  return prisma.applicant.count();
}

export async function getApplicant(id: string) {
  return prisma.applicant.findUnique({
    where: { id },
    include: {
      role: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
      files: { select: fileMetaSelect, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function findApplicantByEmail(email: string, excludeId?: string) {
  return prisma.applicant.findFirst({
    where: { email, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, fullName: true },
  });
}

export async function createApplicant(input: ApplicantInput, createdById: string) {
  return prisma.applicant.create({ data: { ...toData(input), createdById }, select: { id: true } });
}

export async function updateApplicant(id: string, input: ApplicantInput) {
  const result = await prisma.applicant.updateMany({ where: { id }, data: toData(input) });
  return result.count > 0;
}

export async function deleteApplicant(id: string) {
  const result = await prisma.applicant.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function applicantExists(id: string) {
  return (await prisma.applicant.findUnique({ where: { id }, select: { id: true } })) !== null;
}

/** Stores uploaded documents; re-uploading an identical file for the same applicant just updates its kind. */
export async function addApplicantFiles(
  applicantId: string,
  files: {
    kind: ApplicantFileKind;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    fileHash: string;
    bytes: Uint8Array;
    extractedText: string | null;
  }[],
) {
  return prisma.$transaction(async (tx) => {
    for (const { bytes, ...file } of files) {
      await tx.applicantFile.upsert({
        where: { applicantId_fileHash: { applicantId, fileHash: file.fileHash } },
        create: { applicantId, ...file, data: bytes as Uint8Array<ArrayBuffer> },
        update: { kind: file.kind, originalFileName: file.originalFileName },
      });
    }
    // Touch the applicant so it rises to the top of the list.
    await tx.applicant.update({ where: { id: applicantId }, data: { updatedAt: new Date() } });
    return tx.applicantFile.findMany({ where: { applicantId }, select: fileMetaSelect, orderBy: { createdAt: "desc" } });
  });
}

export async function getApplicantFile(applicantId: string, fileId: string) {
  return prisma.applicantFile.findFirst({
    where: { id: fileId, applicantId },
    select: { originalFileName: true, mimeType: true, data: true },
  });
}

export async function deleteApplicantFile(applicantId: string, fileId: string) {
  const result = await prisma.applicantFile.deleteMany({ where: { id: fileId, applicantId } });
  return result.count > 0;
}
