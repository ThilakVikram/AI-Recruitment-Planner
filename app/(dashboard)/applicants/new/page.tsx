import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listRoles } from "@/lib/db/roles";
import { ApplicantForm, EMPTY_APPLICANT } from "@/components/applicants/applicant-form";

export const metadata = { title: "New applicant · Recruiter AI Co-Pilot" };

export default async function NewApplicantPage({ searchParams }: PageProps<"/applicants/new">) {
  await requirePageUser();
  const roles = await listRoles();
  const { role } = await searchParams;
  const roleId = typeof role === "string" && roles.some((r) => r.id === role) ? role : "";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/applicants" className="text-sm text-muted hover:text-ink">← Applicants</Link>
        <h1 className="mt-1 font-display text-lg font-semibold">New applicant</h1>
      </div>
      <ApplicantForm mode="create" roles={roles.map((r) => ({ id: r.id, name: r.name, status: r.status }))} initial={{ ...EMPTY_APPLICANT, roleId }} />
    </div>
  );
}
