import "server-only";
import type { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import type { roleSchema } from "@/lib/validation/requests";

export type RoleInput = z.output<typeof roleSchema>;

export type RoleSummary = { id: string; name: string; description: string | null; status: string; openings: number; updatedAt: Date };

/** Every role — the source for role pickers (recruitments, applicants). */
export async function listRoles(): Promise<RoleSummary[]> {
  return prisma.role.findMany({
    select: { id: true, name: true, description: true, status: true, openings: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRole(roleId: string) {
  return prisma.role.findUnique({ where: { id: roleId } });
}

export async function createRole(data: RoleInput, createdById: string) {
  return prisma.role.create({ data: { ...data, createdById } });
}

export async function updateRole(roleId: string, data: RoleInput) {
  return prisma.role.update({ where: { id: roleId }, data });
}

/** Deletes a role and (by cascade) its whole workspace. Linked applicants are kept and unlinked. */
export async function deleteRole(roleId: string): Promise<boolean> {
  const result = await prisma.role.deleteMany({ where: { id: roleId } });
  return result.count > 0;
}

const roleCounts = { applicants: true, recruitments: true } as const;

/** Roles page listing with pipeline counts. */
export async function listRolesDetailed({ q, status }: { q?: string; status?: string }) {
  const where: Prisma.RoleWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { department: { contains: q } },
      { location: { contains: q } },
      { hiringManager: { contains: q } },
      { requiredSkills: { array_contains: [q] } },
    ];
  }
  const rows = await prisma.role.findMany({
    where,
    include: { _count: { select: roleCounts } },
    orderBy: [{ updatedAt: "desc" }],
  });
  const pipeline = await rolePipelineCounts(rows.map((r) => r.id));
  // Open → On hold → Filled → Closed, most recently updated first within each group.
  const order = ["Open", "On hold", "Filled", "Closed"];
  return rows
    .map((r) => ({ ...r, pipeline: pipeline.get(r.id) ?? EMPTY_PIPELINE }))
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
}

export type RolePipeline = { applicants: number; interview: number; hold: number; selected: number; rejected: number };
const EMPTY_PIPELINE: RolePipeline = { applicants: 0, interview: 0, hold: 0, selected: 0, rejected: 0 };

/**
 * Per role, across all its recruitments: distinct applicants, how many were moved to interview,
 * and how many are on hold, selected or rejected (by the Decision or the final decision).
 */
export async function rolePipelineCounts(roleIds: string[]): Promise<Map<string, RolePipeline>> {
  if (!roleIds.length) return new Map();
  const apps = await prisma.recruitmentApplication.findMany({
    where: { recruitment: { roleId: { in: roleIds } } },
    select: { applicantId: true, decision: true, finalDecision: true, recruitment: { select: { roleId: true } } },
  });
  const sets = new Map<string, { applicants: Set<string>; interview: Set<string>; hold: Set<string>; selected: Set<string>; rejected: Set<string> }>();
  for (const a of apps) {
    const roleId = a.recruitment.roleId;
    let s = sets.get(roleId);
    if (!s) sets.set(roleId, (s = { applicants: new Set(), interview: new Set(), hold: new Set(), selected: new Set(), rejected: new Set() }));
    s.applicants.add(a.applicantId);
    if (a.decision === "Proceed to interview") s.interview.add(a.applicantId);
    if (a.finalDecision === "On hold" || (a.decision === "Hold" && !a.finalDecision)) s.hold.add(a.applicantId);
    if (a.finalDecision === "Selected") s.selected.add(a.applicantId);
    if (a.finalDecision === "Rejected" || a.decision === "Reject") s.rejected.add(a.applicantId);
  }
  return new Map(
    [...sets].map(([roleId, s]) => [roleId, { applicants: s.applicants.size, interview: s.interview.size, hold: s.hold.size, selected: s.selected.size, rejected: s.rejected.size }]),
  );
}

export async function countRolesByStatus() {
  const rows = await prisma.role.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}

/** One role with everything the role detail page shows. */
export async function getRoleDetail(roleId: string) {
  const [role, pipeline] = await Promise.all([
    prisma.role.findUnique({
      where: { id: roleId },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: roleCounts },
        applicants: {
          select: { id: true, fullName: true, status: true, currentTitle: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        },
        recruitments: {
          select: { id: true, status: true, summary: true, openings: true, _count: { select: { applications: true } } },
          orderBy: { id: "desc" },
        },
      },
    }),
    rolePipelineCounts([roleId]),
  ]);
  if (!role) return null;
  return { role, pipeline: pipeline.get(roleId) ?? EMPTY_PIPELINE };
}

/** Lightweight existence check used by every role-scoped API before touching role data. */
export async function roleExists(roleId: string): Promise<boolean> {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
  return role !== null;
}

/** Everything the home page shows: roles with pipeline counts, active recruitments and application totals. */
export async function getHomeOverview() {
  const [roles, recruitments, decisions, finalDecisions, recruitmentStatuses] = await Promise.all([
    prisma.role.findMany({
      select: { id: true, name: true, status: true, openings: true, updatedAt: true, _count: { select: { recruitments: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.recruitment.findMany({
      where: { status: { in: ["Open", "In progress", "On hold"] } },
      select: {
        id: true,
        status: true,
        openings: true,
        summary: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
        applications: { select: { decision: true, finalDecision: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.recruitmentApplication.groupBy({ by: ["decision"], _count: { _all: true } }),
    prisma.recruitmentApplication.groupBy({ by: ["finalDecision"], _count: { _all: true } }),
    prisma.recruitment.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pipeline = await rolePipelineCounts(roles.map((r) => r.id));
  const tally = <K extends string>(rows: ({ _count: { _all: number } } & Record<K, string | null>)[], key: K) =>
    Object.fromEntries(rows.map((r) => [r[key] ?? "", r._count._all])) as Record<string, number>;

  return {
    roles: roles.map((r) => ({ ...r, recruitments: r._count.recruitments, pipeline: pipeline.get(r.id) ?? EMPTY_PIPELINE })),
    recruitments: recruitments.map(({ applications, ...r }) => ({
      ...r,
      applicants: applications.length,
      interview: applications.filter((a) => a.decision === "Proceed to interview").length,
      selected: applications.filter((a) => a.finalDecision === "Selected").length,
      pending: applications.filter((a) => a.decision === "Pending").length,
    })),
    decisions: tally(decisions, "decision"),
    finalDecisions: tally(finalDecisions, "finalDecision"),
    recruitmentStatuses: tally(recruitmentStatuses, "status"),
  };
}
