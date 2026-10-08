import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";

export type StageRecord = {
  stageNumber: number;
  input: string | null;
  inputData: Prisma.JsonValue | null;
  output: string | null;
  outputData: Prisma.JsonValue | null;
  updatedAt: Date;
};

const stageSelect = {
  stageNumber: true,
  input: true,
  inputData: true,
  output: true,
  outputData: true,
  updatedAt: true,
} as const;

export async function getStages(roleId: string): Promise<StageRecord[]> {
  return prisma.roleStage.findMany({
    where: { roleId },
    select: stageSelect,
    orderBy: { stageNumber: "asc" },
  });
}

export async function getStagesByNumber(roleId: string, stageNumbers: number[]): Promise<Map<number, StageRecord>> {
  const rows = await prisma.roleStage.findMany({
    where: { roleId, stageNumber: { in: stageNumbers } },
    select: stageSelect,
  });
  return new Map(rows.map((r) => [r.stageNumber, r]));
}

export async function saveStageInput(
  roleId: string,
  stageNumber: number,
  data: { input?: string; inputData?: Prisma.InputJsonValue },
) {
  return prisma.roleStage.upsert({
    where: { roleId_stageNumber: { roleId, stageNumber } },
    create: { roleId, stageNumber, ...data },
    update: data,
    select: stageSelect,
  });
}

export async function saveStageOutput(
  roleId: string,
  stageNumber: number,
  data: { input?: string; inputData?: Prisma.InputJsonValue; output: string; outputData?: Prisma.InputJsonValue },
) {
  return prisma.roleStage.upsert({
    where: { roleId_stageNumber: { roleId, stageNumber } },
    create: { roleId, stageNumber, ...data },
    update: data,
    select: stageSelect,
  });
}
