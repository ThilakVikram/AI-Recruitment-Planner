import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import type { Platform } from "@/lib/workflow/constants";
import { normalizeName } from "@/lib/validation/normalize";

export async function listSourcingProfiles(roleId: string) {
  return prisma.sourcingProfile.findMany({
    where: { roleId },
    orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

export async function createSourcingProfile(
  roleId: string,
  data: { platform: Platform; candidateName: string; referenceUrl?: string | null; profileText: string },
) {
  return prisma.sourcingProfile.create({
    data: { roleId, ...data, referenceUrl: data.referenceUrl || null },
  });
}

/** Deletes only if the profile belongs to the given role. Returns false if not found in that role. */
export async function deleteSourcingProfile(roleId: string, profileId: string): Promise<boolean> {
  const result = await prisma.sourcingProfile.deleteMany({ where: { id: profileId, roleId } });
  return result.count > 0;
}

export async function getSourcingProfilesForAnalysis(roleId: string, profileIds?: string[]) {
  return prisma.sourcingProfile.findMany({
    where: { roleId, ...(profileIds?.length ? { id: { in: profileIds } } : {}) },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveProfileAnalysis(
  roleId: string,
  profileId: string,
  data: { analysis: Prisma.InputJsonValue; score: number; verdict: string },
) {
  return prisma.sourcingProfile.updateMany({ where: { id: profileId, roleId }, data });
}

/** Best-effort match of a candidate to a sourcing profile in the same role (by normalised name). */
export async function findSourcingProfileByName(roleId: string, normalizedName: string) {
  const profiles = await prisma.sourcingProfile.findMany({
    where: { roleId },
    select: { candidateName: true, platform: true, profileText: true, analysis: true, score: true, verdict: true },
  });
  return profiles.find((p) => normalizeName(p.candidateName) === normalizedName) ?? null;
}
