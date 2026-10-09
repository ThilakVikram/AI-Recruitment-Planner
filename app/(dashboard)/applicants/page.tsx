import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listApplicants } from "@/lib/db/applicants";
import { listRoles } from "@/lib/db/roles";
import { roleOptionLabel } from "@/lib/roles/constants";
import { APPLICANT_PAGE_SIZE, APPLICANT_STATUSES } from "@/lib/applicants/constants";
import { asStringArray } from "@/lib/applicants/dto";
import { StatusBadge } from "@/components/applicants/status-badge";

export const metadata = { title: "Applicants · Recruiter AI Co-Pilot" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function hrefWith(params: { q?: string; status?: string; role?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.role) search.set("role", params.role);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/applicants?${qs}` : "/applicants";
}

export default async function ApplicantsPage({ searchParams }: PageProps<"/applicants">) {
  await requirePageUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && (APPLICANT_STATUSES as readonly string[]).includes(params.status) ? params.status : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const roles = await listRoles();
  const role = typeof params.role === "string" ? roles.find((r) => r.id === params.role)?.id ?? "" : "";

  const { total, rows } = await listApplicants({ q: q || undefined, status: status || undefined, roleId: role || undefined, page });
  const pages = Math.max(1, Math.ceil(total / APPLICANT_PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold">Applicants</h1>
          <p className="mt-1 text-sm text-muted">Your talent pool — contact details, CVs and other documents, searchable in one place.</p>
        </div>
        <Link href={role ? `/applicants/new?role=${role}` : "/applicants/new"} className="btn-primary">+ New applicant</Link>
      </div>

      <div className="card space-y-3 p-3">
        <form action="/applicants" className="flex flex-wrap gap-2 sm:flex-nowrap" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="role" defaultValue={role} className="input cursor-pointer sm:w-56" aria-label="Filter by role">
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{roleOptionLabel(r)}</option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            className="input"
            placeholder="Search name, email, phone, title, company, location or an exact skill…"
            aria-label="Search applicants"
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Filter by status">
          {["", ...APPLICANT_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={hrefWith({ q, status: s, role })}
              aria-current={s === status ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
                s === status ? "border-primary bg-primary/15 text-primary-strong" : "border-line text-muted hover:text-ink"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Applicant</th>
                  <th className="px-4 py-2.5 font-medium">Current role</th>
                  <th className="px-4 py-2.5 font-medium">Skills</th>
                  <th className="px-4 py-2.5 font-medium">Applied for</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Docs</th>
                  <th className="px-4 py-2.5 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => {
                  const skills = asStringArray(a.skills);
                  const hasCv = a.files.some((f) => f.kind === "CV");
                  return (
                    <tr key={a.id} className="hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <Link href={`/applicants/${a.id}`} className="font-medium hover:text-primary-strong">{a.fullName}</Link>
                        <div className="text-xs text-muted">{[a.email, a.phone].filter(Boolean).join(" · ") || "No contact details"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{a.currentTitle || <span className="text-faint">—</span>}</div>
                        <div className="text-xs text-muted">
                          {[a.currentCompany, a.experienceYears !== null ? `${Number(a.experienceYears)} yrs` : null, a.location].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-56 flex-wrap gap-1">
                          {skills.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">{s}</span>
                          ))}
                          {skills.length > 3 && <span className="text-xs text-faint">+{skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{a.role?.name ?? <span className="text-faint">—</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {a.files.length ? `${a.files.length} file${a.files.length > 1 ? "s" : ""}` : "—"}
                        {hasCv && <span className="ml-1.5 rounded bg-fit-strong/15 px-1 py-0.5 text-[0.65rem] text-fit-strong">CV</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-muted">{dateFormat.format(a.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {total} applicant{total === 1 ? "" : "s"}
              {pages > 1 && ` · page ${page} of ${pages}`}
            </span>
            {pages > 1 && (
              <div className="flex gap-2">
                {page > 1 && <Link href={hrefWith({ q, status, role, page: page - 1 })} className="btn-secondary py-1.5">Previous</Link>}
                {page < pages && <Link href={hrefWith({ q, status, role, page: page + 1 })} className="btn-secondary py-1.5">Next</Link>}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card p-10 text-center">
          <p className="font-medium">{q || status || role ? "No applicants match these filters." : "No applicants yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {q || status || role ? <Link href="/applicants" className="text-primary-strong underline">Clear filters</Link> : "Add your first applicant to start building your talent pool."}
          </p>
        </div>
      )}
    </div>
  );
}
