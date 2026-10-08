import { requirePageUser } from "@/lib/auth/session";
import { resolveActiveRole } from "@/lib/roles/active-role";
import { getStages } from "@/lib/db/stages";
import { listCandidates } from "@/lib/db/candidates";
import { listSourcingProfiles } from "@/lib/db/sourcing";
import { toCandidateDTO, toSourcingProfileDTO, toStageDTOs } from "@/lib/workflow/dto";
import { STAGE_COUNT } from "@/lib/workflow/stages";
import { Workflow } from "@/components/workflow/workflow";
import { NoRoles } from "@/components/roles/no-roles";

export const metadata = { title: "Workflow · Recruiter AI Co-Pilot" };

export default async function WorkflowPage({ searchParams }: PageProps<"/workflow">) {
  await requirePageUser();
  const params = await searchParams;
  const { role } = await resolveActiveRole("/workflow", params);
  if (!role) return <NoRoles />;

  // Every query below is scoped to the active role only.
  const [stageRows, candidates, profiles] = await Promise.all([
    getStages(role.id),
    listCandidates(role.id),
    listSourcingProfiles(role.id),
  ]);

  const kickoff = stageRows.find((s) => s.stageNumber === 1)?.outputData as { jobDescription?: string } | null;
  const stageParam = Number(params.stage);
  const initialStage = Number.isInteger(stageParam) && stageParam >= 1 && stageParam <= STAGE_COUNT ? stageParam : 1;

  return (
    <Workflow
      key={role.id}
      role={{ id: role.id, name: role.name, description: role.description }}
      initialStage={initialStage}
      stages={toStageDTOs(stageRows)}
      candidates={candidates.map(toCandidateDTO)}
      profiles={profiles.map(toSourcingProfileDTO)}
      defaultJd={kickoff?.jobDescription ?? ""}
    />
  );
}
