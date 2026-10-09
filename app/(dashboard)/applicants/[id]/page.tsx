import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getApplicant } from "@/lib/db/applicants";
import { listRoles } from "@/lib/db/roles";
import { getApplicantApplications } from "@/lib/db/recruitments";
import { toApplicationDTO } from "@/lib/recruitment/dto";
import { asMetadata, asStringArray, toFileDTO } from "@/lib/applicants/dto";
import { ApplicantForm } from "@/components/applicants/applicant-form";
import { ApplicantFiles } from "@/components/applicants/applicant-files";
import { DeleteApplicantButton } from "@/components/applicants/delete-applicant-button";
import { StatusBadge } from "@/components/applicants/status-badge";
import { initialsOf } from "@/components/layout/initials";
import { ApplicantRecruitments } from "@/components/recruitment/applicant-recruitments";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export async function generateMetadata({ params }: PageProps<"/applicants/[id]">) {
  await requirePageUser();
  const applicant = await getApplicant((await params).id);
  return { title: `${applicant?.fullName ?? "Applicant"} · Recruiter AI Co-Pilot` };
}

export default async function ApplicantPage({ params, searchParams }: PageProps<"/applicants/[id]">) {
  await requirePageUser();
  const { id } = await params;
  const { uploadError } = await searchParams;
  const [applicant, roles, applications] = await Promise.all([getApplicant(id), listRoles(), getApplicantApplications(id)]);
  if (!applicant) notFound();

  const s = (v: string | null) => v ?? "";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/applicants" className="text-sm text-muted hover:text-ink">← Applicants</Link>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display font-semibold text-primary-strong">
            {initialsOf(applicant.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold">{applicant.fullName}</h1>
              <StatusBadge status={applicant.status} />
            </div>
            <p className="text-sm text-muted">
              {[applicant.currentTitle, applicant.currentCompany].filter(Boolean).join(" at ") || "No current role recorded"}
              {applicant.role && <> · Applied for <Link href={`/roles/${applicant.role.id}`} className="text-primary-strong hover:underline">{applicant.role.name}</Link></>}
            </p>
          </div>
          <DeleteApplicantButton applicantId={applicant.id} name={applicant.fullName} />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ApplicantForm
          mode="edit"
          applicantId={applicant.id}
          roles={roles.map((r) => ({ id: r.id, name: r.name, status: r.status }))}
          initial={{
            fullName: applicant.fullName,
            email: s(applicant.email),
            phone: s(applicant.phone),
            location: s(applicant.location),
            currentTitle: s(applicant.currentTitle),
            currentCompany: s(applicant.currentCompany),
            experienceYears: applicant.experienceYears === null ? "" : String(Number(applicant.experienceYears)),
            noticePeriod: s(applicant.noticePeriod),
            currentCtc: s(applicant.currentCtc),
            expectedCtc: s(applicant.expectedCtc),
            source: s(applicant.source),
            status: applicant.status,
            linkedinUrl: s(applicant.linkedinUrl),
            portfolioUrl: s(applicant.portfolioUrl),
            skills: asStringArray(applicant.skills),
            metadata: asMetadata(applicant.metadata),
            notes: s(applicant.notes),
            roleId: s(applicant.roleId),
          }}
        />

        <div className="space-y-5 lg:sticky lg:top-24">
          <ApplicantFiles
            applicantId={applicant.id}
            initialFiles={applicant.files.map(toFileDTO)}
            initialError={typeof uploadError === "string" ? `Applicant saved, but the upload failed: ${uploadError}` : undefined}
          />
          <section className="card p-5 text-sm">
            <h2 className="label">Record</h2>
            <dl className="mt-2 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Added</dt>
                <dd className="text-right">{dateFormat.format(applicant.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Added by</dt>
                <dd className="truncate text-right">{applicant.createdBy?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Last updated</dt>
                <dd className="text-right">{dateFormat.format(applicant.updatedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <ApplicantRecruitments
        items={applications.map((a) => ({
          recruitmentId: a.recruitment.id,
          status: a.recruitment.status,
          role: a.recruitment.role,
          jobManagementReady: a.recruitment.sections.length > 0,
          rank: a.rank,
          total: a.recruitment._count.applications,
          app: toApplicationDTO(a),
        }))}
      />
    </div>
  );
}
