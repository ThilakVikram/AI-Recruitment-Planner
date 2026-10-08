import { requirePageUser } from "@/lib/auth/session";
import { resolveActiveRole } from "@/lib/roles/active-role";
import { listCandidates } from "@/lib/db/candidates";
import { toCandidateDTO } from "@/lib/workflow/dto";
import { TrackerTable } from "@/components/tracker/tracker-table";
import { NoRoles } from "@/components/roles/no-roles";

export const metadata = { title: "Candidate Tracker · Recruiter AI Co-Pilot" };

export default async function TrackerPage({ searchParams }: PageProps<"/tracker">) {
  await requirePageUser();
  const { role } = await resolveActiveRole("/tracker", await searchParams);
  if (!role) return <NoRoles />;

  const candidates = (await listCandidates(role.id)).filter((c) => c.score !== null).map(toCandidateDTO);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-lg font-semibold">
          <span className="text-muted">Candidate Tracker · </span>
          {role.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Scored candidates for this role, highest score first. Decisions and notes save automatically and are kept when a candidate is rescored.
        </p>
      </div>
      <TrackerTable key={role.id} roleId={role.id} initialCandidates={candidates} />
    </div>
  );
}
