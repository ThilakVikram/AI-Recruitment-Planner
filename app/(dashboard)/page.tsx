import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { getHomeOverview } from "@/lib/db/roles";
import { countApplicants } from "@/lib/db/applicants";
import { recruitmentCode, recruitmentSlug } from "@/lib/recruitment/constants";
import { initialsOf } from "@/components/layout/initials";
import { RoleStatusBadge } from "@/components/roles/role-badges";
import { RecruitmentStatusBadge } from "@/components/recruitment/status-badge";
import { NewRecruitmentButton } from "@/components/recruitment/new-recruitment-button";

export const metadata = { title: "Home · Recruiter AI Co-Pilot" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** How a hire moves through the app — shown at the bottom of the home page. */
const STEPS = [
  { title: "Create a role", body: "Requirements, skills, openings and status — the requisition every recruitment builds on.", href: "/roles" },
  {
    title: "Start a recruitment",
    body: "Capture the kick-off meeting, then generate the job description, scorecard, job posts, market research and sourcing strategy.",
    href: "/recruitment",
  },
  {
    title: "Attach & rank applicants",
    body: "Drop in CVs or analysed LinkedIn / Naukri profiles — each is scored 0–100 against the job description.",
    href: "/recruitment",
  },
  {
    title: "Interview & decide",
    body: "Move applicants to interview, write outreach and screening reports, then mark them Selected, On hold or Rejected.",
    href: "/applicants",
  },
];

export default async function HomePage() {
  const user = await requirePageUser();
  const [{ roles, recruitments, decisions, finalDecisions, recruitmentStatuses }, applicantCount] = await Promise.all([getHomeOverview(), countApplicants()]);
  const firstName = user.name.split(/\s+/)[0] || user.name;
  const activeRecruitments = (recruitmentStatuses["Open"] ?? 0) + (recruitmentStatuses["In progress"] ?? 0);

  const stats = [
    { label: "Open roles", value: roles.filter((r) => r.status === "Open").length, href: "/roles?status=Open", tone: "" },
    { label: "Active recruitments", value: activeRecruitments, href: "/recruitment", tone: "" },
    { label: "Applicants in talent pool", value: applicantCount, href: "/applicants", tone: "" },
    { label: "Awaiting a decision", value: decisions["Pending"] ?? 0, href: null, tone: "" },
    { label: "Moved to interview", value: decisions["Proceed to interview"] ?? 0, href: null, tone: "" },
    { label: "Selected", value: finalDecisions["Selected"] ?? 0, href: null, tone: "text-fit-strong" },
  ];
  const pickerRoles = roles.map((r) => ({ id: r.id, name: r.name, status: r.status, openings: r.openings }));

  return (
    <div className="space-y-8">
      {/* Welcome + account */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card relative overflow-hidden p-6 lg:col-span-2">
          <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{firstName}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Recruiter AI Co-Pilot runs each hiring drive from the kick-off meeting to the final decision — AI-written job documents,
            CVs ranked against the job description, and outreach, screening and decision messages for every applicant.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {roles.length ? (
              <NewRecruitmentButton roles={pickerRoles} />
            ) : (
              <Link href="/roles/new" className="btn-primary">+ Create your first role</Link>
            )}
            <Link href="/recruitment" className="btn-secondary">All recruitments</Link>
            <Link href="/applicants" className="btn-ghost">Applicants</Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="label">Your account</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display text-base font-semibold text-primary-strong">
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium">{user.name}</div>
              <div className="truncate text-sm text-muted">{user.email}</div>
            </div>
          </div>
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Member since</dt>
              <dd>{dateFormat.format(user.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd className="flex items-center gap-1.5 text-fit-strong">
                <span className="h-1.5 w-1.5 rounded-full bg-fit-strong" aria-hidden /> Active
              </dd>
            </div>
          </dl>
          <a href="/change-password" className="btn-secondary mt-5 w-full">Change password</a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="Overview">
        {stats.map((s) => {
          const body = (
            <>
              <div className={`font-display text-2xl font-semibold ${s.tone}`}>{s.value}</div>
              <div className="mt-1 text-xs text-muted">{s.label}</div>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-4 transition hover:border-primary/60">{body}</Link>
          ) : (
            <div key={s.label} className="card p-4">{body}</div>
          );
        })}
      </section>

      {/* Active recruitments */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Active recruitments</h2>
            <p className="text-sm text-muted">Open, in progress or on hold — most recently updated first.</p>
          </div>
          <Link href="/recruitment" className="btn-ghost py-1.5">View all</Link>
        </div>
        {recruitments.length ? (
          <div className="card divide-y divide-line overflow-hidden">
            {recruitments.map((r) => (
              <Link
                key={r.id}
                href={`/recruitment/${recruitmentSlug(r.id)}`}
                className="flex flex-col gap-3 px-4 py-3 transition hover:bg-surface-2/60 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-sm text-primary-strong">{recruitmentCode(r.id)}</span>
                    <span className="min-w-0 font-semibold">{r.role.name}</span>
                    <RecruitmentStatusBadge status={r.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.openings} opening{r.openings === 1 ? "" : "s"}
                    {r.summary && ` · ${r.summary}`} · updated {dateFormat.format(r.updatedAt)}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted md:w-80 md:shrink-0">
                  <div><div className="font-display text-base font-semibold text-ink">{r.applicants}</div>applicants</div>
                  <div><div className="font-display text-base font-semibold text-ink">{r.pending}</div>pending</div>
                  <div><div className="font-display text-base font-semibold text-ink">{r.interview}</div>interview</div>
                  <div><div className="font-display text-base font-semibold text-fit-strong">{r.selected}</div>selected</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            No active recruitments.{" "}
            {roles.length ? "Start one for a role to begin hiring." : "Create a role first, then start a recruitment for it."}
          </div>
        )}
      </section>

      {/* Roles */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Your roles</h2>
            <p className="text-sm text-muted">Applicants across each role’s recruitments.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/roles" className="btn-ghost py-1.5">Manage roles</Link>
            <Link href="/roles/new" className="btn-secondary py-1.5">+ New role</Link>
          </div>
        </div>
        {roles.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.slice(0, 6).map((role) => (
              <Link key={role.id} href={`/roles/${role.id}`} className="card group flex flex-col p-4 transition hover:border-primary/60">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold group-hover:text-primary-strong">{role.name}</span>
                  <RoleStatusBadge status={role.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {role.openings} opening{role.openings === 1 ? "" : "s"} · {role.recruitments} recruitment{role.recruitments === 1 ? "" : "s"}
                </p>
                <div className="mt-auto grid grid-cols-4 gap-2 border-t border-line pt-3 text-center text-xs text-muted">
                  <div><div className="font-display text-base font-semibold text-ink">{role.pipeline.applicants}</div>applicants</div>
                  <div><div className="font-display text-base font-semibold text-ink">{role.pipeline.interview}</div>interview</div>
                  <div><div className="font-display text-base font-semibold text-fit-strong">{role.pipeline.selected}</div>selected</div>
                  <div><div className="font-display text-base font-semibold text-fit-not">{role.pipeline.rejected}</div>rejected</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            No roles yet. A role holds the requirements every recruitment for it builds on.
          </div>
        )}
        {roles.length > 6 && (
          <Link href="/roles" className="mt-3 inline-block text-sm text-primary-strong hover:underline">View all {roles.length} roles →</Link>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-lg font-semibold">How it works</h2>
        <p className="text-sm text-muted">From requisition to final decision.</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Link href={step.href} className="card group flex h-full flex-col p-4 transition hover:border-primary/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-strong">{i + 1}</span>
                  <h3 className="font-semibold group-hover:text-primary-strong">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
