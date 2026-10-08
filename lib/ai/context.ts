import "server-only";
import { getRole } from "@/lib/db/roles";
import { getStagesByNumber, type StageRecord } from "@/lib/db/stages";
import { getStage } from "@/lib/workflow/stages";
import { ApiError } from "@/lib/api/errors";
import type { KickoffOutput } from "./schemas/kickoff";

/** Previous stages each stage may see. Only these outputs are sent to the model. */
export const STAGE_CONTEXT_DEPENDENCIES: Record<number, number[]> = {
  1: [],
  2: [1],
  3: [1, 2],
  4: [1],
  5: [1],
  6: [1],
  7: [],
};

const MAX_CONTEXT_CHARS_PER_STAGE = 30_000;

export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n\n[…truncated…]`;
}

function kickoffData(stage?: StageRecord): Partial<KickoffOutput> | null {
  const data = stage?.outputData;
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Partial<KickoffOutput>) : null;
}

/** Formats previous-stage outputs as labelled sections. */
export function formatPreviousContext(stages: Map<number, StageRecord>, stageNumbers: number[]): string {
  const sections = stageNumbers
    .map((n) => {
      const output = stages.get(n)?.output?.trim();
      if (!output) return null;
      return `### Stage ${n} — ${getStage(n).title} output\n\n${clip(output, MAX_CONTEXT_CHARS_PER_STAGE)}`;
    })
    .filter(Boolean);
  return sections.length ? sections.join("\n\n") : "No previous stage output is available yet.";
}

export type RoleHiringContext = {
  roleName: string;
  jobDescription: string;
  scorecard: string;
  hasJobDescription: boolean;
  stages: Map<number, StageRecord>;
};

/**
 * Loads the role and the stage outputs the given stage depends on.
 * JD precedence: the (editable) Stage 4 JD → Stage 1 structured JD → full Stage 1 output.
 */
export async function loadRoleContext(roleId: string, stageNumber: number): Promise<RoleHiringContext> {
  const role = await getRole(roleId);
  if (!role) throw new ApiError(404, "Role not found.");

  const deps = STAGE_CONTEXT_DEPENDENCIES[stageNumber] ?? [];
  const stages = await getStagesByNumber(roleId, Array.from(new Set([...deps, 1, 4])));
  const kickoff = kickoffData(stages.get(1));

  const jobDescription =
    stages.get(4)?.input?.trim() || kickoff?.jobDescription?.trim() || stages.get(1)?.output?.trim() || "";
  const scorecard = kickoff?.scorecard?.trim() || "No separate scorecard is available — use the job description.";

  return {
    roleName: role.name,
    jobDescription: jobDescription || "Not available.",
    scorecard,
    hasJobDescription: Boolean(jobDescription),
    stages,
  };
}
