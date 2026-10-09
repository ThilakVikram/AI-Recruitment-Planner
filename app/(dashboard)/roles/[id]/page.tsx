import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getRole, getRoleDetail } from "@/lib/db/roles";
import { asSkillList, shortDate } from "@/lib/roles/format";
import { RoleForm } from "@/components/roles/role-form";
import { DeleteRoleButton } from "@/components/roles/delete-role-button";
import { PriorityLabel, RoleStatusBadge } from "@/components/roles/role-badges";
import { StatusBadge } from "@/components/applicants/status-badge";
import { NewRecruitmentButton } from "@/components/recruitment/new-recruitment-button";
import { RecruitmentStatusBadge } from "@/components/recruitment/status-badge";
import { recruitmentCode, recruitmentSlug } from "@/lib/recruitment/constants";

export async function generateMetadata({ params }: PageProps<"/roles/[id]">) {
  await requirePageUser();
  const role = await getRole((await params).id);
  return { title: `${role?.name ?? "Role"} · Recruiter AI Co-Pilot` };
}

export default async function RolePage({ params }: PageProps<"/roles/[id]">) {
  await requirePageUser();
  const { id } = await params;
  const detail = await getRoleDetail(id);
  if (!detail) notFound();
  const { role, pipeline } = detail;
  const s = (v: string | null) => v ?? "";
  const n = (v: number | null) => (v === null ? "" : String(v));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/roles" className="text-sm text-muted hover:text-ink">← Roles</Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold">{role.name}</h1>
              <RoleStatusBadge status={role.status} />
              <PriorityLabel priority={role.priority} />
            </div>
            <p className="text-sm text-muted">
              {[role.department, role.location, role.workMode, role.employmentType].filter(Boolean).join(" · ") || "Add details below"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NewRecruitmentButton
              roles={[{ id: role.id, name: role.name, status: role.status, openings: role.openings }]}
              defaultRoleId={role.id}
            />
            <Link href={`/applicants?role=${role.id}`} className="btn-secondary">Applicants</Link>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <RoleForm
          mode="edit"
          roleId={role.id}
          initial={{
            name: role.name,
            description: s(role.description),
            department: s(role.department),
            location: s(role.location),
            workMode: s(role.workMode),
            employmentType: s(role.employmentType),
            openings: String(role.openings),
            experienceMin: n(role.experienceMin),
            experienceMax: n(role.experienceMax),
            salaryRange: s(role.salaryRange),
            hiringManager: s(role.hiringManager),
            targetDate: role.targetDate ? role.targetDate.toISOString().slice(0, 10) : "",
            priority: role.priority,
            status: role.status,
            requiredSkills: asSkillList(role.requiredSkills),
            niceToHaveSkills: asSkillList(role.niceToHaveSkills),
          }}
        />

        <div className="space-y-5 lg:sticky lg:top-24">
          <section className="card p-5">
            <h2 className="label">Pipeline</h2>
            <p className="text-xs text-muted">Across this role’s {role._count.recruitments} recruitment{role._count.recruitments === 1 ? "" : "s"}.</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {(
                [
                  ["Applicants", pipeline.applicants, ""],
                  ["Moved to interview", pipeline.interview, ""],
                  ["On hold", pipeline.hold, "text-fit-average"],
                  ["Selected", pipeline.selected, "text-fit-strong"],
                  ["Rejected", pipeline.rejected, "text-fit-not"],
                  ["Linked in Applicants", role._count.applicants, ""],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label} className="flex flex-col-reverse rounded-lg bg-surface-2 p-2.5">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className={`font-display text-lg font-semibold ${tone}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="label mb-0">Recruitments</h2>
              <NewRecruitmentButton
                roles={[{ id: role.id, name: role.name, status: role.status, openings: role.openings }]}
                defaultRoleId={role.id}
                className="text-xs text-primary-strong hover:underline"
              />
            </div>
            {role.recruitments.length ? (
              <ul className="mt-3 space-y-2">
                {role.recruitments.map((rec) => (
                  <li key={rec.id}>
                    <Link href={`/recruitment/${recruitmentSlug(rec.id)}`} className="flex items-center gap-2 text-sm hover:text-primary-strong">
                      <span className="font-mono text-xs text-primary-strong">{recruitmentCode(rec.id)}</span>
                      <span className="min-w-0 flex-1 truncate text-muted">
                        {rec._count.applications} applicant{rec._count.applications === 1 ? "" : "s"} · {rec.openings} opening{rec.openings === 1 ? "" : "s"}
                      </span>
                      <RecruitmentStatusBadge status={rec.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No recruitments for this role yet.</p>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="label mb-0">Linked applicants</h2>
              <Link href={`/applicants/new?role=${role.id}`} className="text-xs text-primary-strong hover:underline">+ Add</Link>
            </div>
            {role.applicants.length ? (
              <ul className="mt-3 space-y-2">
                {role.applicants.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/applicants/${a.id}`} className="min-w-0 truncate hover:text-primary-strong">
                      {a.fullName}
                      {a.currentTitle && <span className="text-muted"> · {a.currentTitle}</span>}
                    </Link>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No applicants linked yet.</p>
            )}
            {role._count.applicants > role.applicants.length && (
              <Link href={`/applicants?role=${role.id}`} className="mt-3 block text-xs text-primary-strong hover:underline">
                View all {role._count.applicants} →
              </Link>
            )}
          </section>

          <section className="card p-5 text-sm">
            <h2 className="label">Record</h2>
            <dl className="mt-2 space-y-2">
              <div className="flex justify-between gap-3"><dt className="text-muted">Created</dt><dd>{shortDate.format(role.createdAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Created by</dt><dd className="truncate">{role.createdBy?.name ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Last updated</dt><dd>{shortDate.format(role.updatedAt)}</dd></div>
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              <DeleteRoleButton roleId={role.id} name={role.name} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
