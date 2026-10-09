import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { countRolesByStatus, listRolesDetailed } from "@/lib/db/roles";
import { ROLE_STATUSES } from "@/lib/roles/constants";
import { asSkillList, formatExperience, shortDate } from "@/lib/roles/format";
import { PriorityLabel, RoleStatusBadge } from "@/components/roles/role-badges";

export const metadata = { title: "Roles · Recruiter AI Co-Pilot" };

function hrefWith(params: { q?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return qs ? `/roles?${qs}` : "/roles";
}

export default async function RolesPage({ searchParams }: PageProps<"/roles">) {
  await requirePageUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && (ROLE_STATUSES as readonly string[]).includes(params.status) ? params.status : "";

  const [roles, counts] = await Promise.all([listRolesDetailed({ q: q || undefined, status: status || undefined }), countRolesByStatus()]);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const openPositions = roles.filter((r) => r.status === "Open").reduce((sum, r) => sum + r.openings, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold">Roles</h1>
          <p className="mt-1 text-sm text-muted">
            The positions you’re hiring for. Each role can have recruitments, and applicants can be linked to it.
          </p>
        </div>
        <Link href="/roles/new" className="btn-primary">+ New role</Link>
      </div>

      <div className="card space-y-3 p-3">
        <form action="/roles" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <input type="search" name="q" defaultValue={q} className="input" placeholder="Search title, department, location, hiring manager or an exact skill…" aria-label="Search roles" />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Filter by status">
          {["", ...ROLE_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={hrefWith({ q, status: s })}
              aria-current={s === status ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
                s === status ? "border-primary bg-primary/15 text-primary-strong" : "border-line text-muted hover:text-ink"
              }`}
            >
              {s || "All"} <span className="text-faint">{s ? (counts[s] ?? 0) : totalAll}</span>
            </Link>
          ))}
        </div>
      </div>

      {roles.length ? (
        <>
          {(!status || status === "Open") && openPositions > 0 && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{openPositions}</span> open position{openPositions === 1 ? "" : "s"} across{" "}
              {roles.filter((r) => r.status === "Open").length} open role{roles.filter((r) => r.status === "Open").length === 1 ? "" : "s"}.
            </p>
          )}
          <div className="space-y-3">
            {roles.map((role) => {
              const skills = asSkillList(role.requiredSkills);
              const meta = [role.department, role.location, role.workMode, formatExperience(role.experienceMin, role.experienceMax)].filter(Boolean);
              const stats: [string, number, string][] = [
                ["applicants", role.pipeline.applicants, "text-ink"],
                ["interview", role.pipeline.interview, "text-ink"],
                ["hold", role.pipeline.hold, "text-fit-average"],
                ["selected", role.pipeline.selected, "text-fit-strong"],
                ["rejected", role.pipeline.rejected, "text-fit-not"],
              ];
              return (
                <Link
                  key={role.id}
                  href={`/roles/${role.id}`}
                  className={`card group flex flex-col gap-4 p-4 transition hover:border-primary/60 lg:flex-row lg:items-center ${role.status === "Closed" ? "opacity-70" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="min-w-0 font-semibold group-hover:text-primary-strong">{role.name}</h2>
                      <RoleStatusBadge status={role.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{meta.join(" · ") || "No details added yet"}</p>
                    {skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {skills.slice(0, 8).map((s) => (
                          <span key={s} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">{s}</span>
                        ))}
                        {skills.length > 8 && <span className="text-xs text-faint">+{skills.length - 8}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs lg:w-44 lg:flex-col lg:items-end lg:justify-center lg:gap-1">
                    <PriorityLabel priority={role.priority} />
                    <span className="text-muted">
                      {role.openings} opening{role.openings === 1 ? "" : "s"}
                      {role.targetDate && ` · by ${shortDate.format(role.targetDate)}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 border-t border-line pt-3 text-center text-xs text-muted lg:w-[26rem] lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
                    {stats.map(([label, value, tone]) => (
                      <div key={label}><div className={`font-display text-base font-semibold ${tone}`}>{value}</div>{label}</div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card p-10 text-center">
          <p className="font-medium">{q || status ? "No roles match these filters." : "No roles yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {q || status ? <Link href="/roles" className="text-primary-strong underline">Clear filters</Link> : "Create the first role you need to hire for."}
          </p>
        </div>
      )}
    </div>
  );
}
