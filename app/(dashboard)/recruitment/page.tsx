import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { countRecruitmentsByStatus, listRecruitments } from "@/lib/db/recruitments";
import { listRoles } from "@/lib/db/roles";
import { RECRUITMENT_STATUSES, SECTIONS, recruitmentCode, recruitmentSlug } from "@/lib/recruitment/constants";
import { NewRecruitmentButton } from "@/components/recruitment/new-recruitment-button";
import { RecruitmentStatusBadge } from "@/components/recruitment/status-badge";
import { RoleStatusBadge } from "@/components/roles/role-badges";

export const metadata = { title: "Recruitment · Recruiter AI Co-Pilot" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function hrefWith(params: { q?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return qs ? `/recruitment?${qs}` : "/recruitment";
}

export default async function RecruitmentListPage({ searchParams }: PageProps<"/recruitment">) {
  await requirePageUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && (RECRUITMENT_STATUSES as readonly string[]).includes(params.status) ? params.status : "";

  const [recruitments, counts, roles] = await Promise.all([
    listRecruitments({ q: q || undefined, status: status || undefined }),
    countRecruitmentsByStatus(),
    listRoles(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold">Recruitment</h1>
          <p className="mt-1 text-sm text-muted">Every hiring drive with its role and status. Open one to add kick-off notes, generate documents and score CVs.</p>
        </div>
        <NewRecruitmentButton roles={roles.map((r) => ({ id: r.id, name: r.name, status: r.status, openings: r.openings }))} />
      </div>

      <div className="card space-y-3 p-3">
        <form action="/recruitment" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <input type="search" name="q" defaultValue={q} className="input" placeholder="Search by number (e.g. 007), role or summary…" aria-label="Search recruitments" />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Filter by status">
          {["", ...RECRUITMENT_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={hrefWith({ q, status: s })}
              aria-current={s === status ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
                s === status ? "border-primary bg-primary/15 text-primary-strong" : "border-line text-muted hover:text-ink"
              }`}
            >
              {s || "All"} <span className="text-faint">{s ? (counts[s] ?? 0) : total}</span>
            </Link>
          ))}
        </div>
      </div>

      {recruitments.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Summary</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">AI sections</th>
                <th className="px-4 py-2.5 font-medium">Applicants</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recruitments.map((r) => {
                const href = `/recruitment/${recruitmentSlug(r.id)}`;
                const top = r.applications[0]?.score;
                return (
                  <tr key={r.id} className="group relative hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {/* The stretched link makes the whole row clickable. */}
                      <Link href={href} className="font-semibold text-primary-strong after:absolute after:inset-0">{recruitmentCode(r.id)}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.role.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <RoleStatusBadge status={r.role.status} />
                        {r.role.location}
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-3 text-muted"><p className="line-clamp-2">{r.summary || "—"}</p></td>
                    <td className="px-4 py-3"><RecruitmentStatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted">{r._count.sections}/{SECTIONS.length}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {r._count.applications}
                      {top !== undefined && top !== null && <span className="ml-1 text-faint">· top {top}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted">
                      {dateFormat.format(r.createdAt)}
                      {r.createdBy && <div className="text-faint">{r.createdBy.name}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="font-medium">{q || status ? "No recruitments match these filters." : "No recruitments yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {q || status ? <Link href="/recruitment" className="text-primary-strong underline">Clear filters</Link> : "Start one for a role you’re hiring for."}
          </p>
        </div>
      )}
    </div>
  );
}
