import "server-only";
import { prisma } from "./prisma";
import { STAGES } from "@/lib/workflow/stages";

export type RoleSummary = { id: string; name: string; description: string | null; updatedAt: Date };

export async function listRoles(): Promise<RoleSummary[]> {
  return prisma.role.findMany({
    select: { id: true, name: true, description: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRole(roleId: string) {
  return prisma.role.findUnique({ where: { id: roleId } });
}

/** Creates a role and its seven (empty) stage rows atomically. */
export async function createRole(data: { name: string; description?: string | null }) {
  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      stages: { create: STAGES.map((s) => ({ stageNumber: s.number })) },
    },
  });
}

export async function updateRole(roleId: string, data: { name?: string; description?: string | null }) {
  return prisma.role.update({ where: { id: roleId }, data });
}

/** Lightweight existence check used by every role-scoped API before touching role data. */
export async function roleExists(roleId: string): Promise<boolean> {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
  return role !== null;
}
