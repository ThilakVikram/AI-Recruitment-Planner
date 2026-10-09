import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { getHomeOverview } from "@/lib/db/roles";
import { STAGES, STAGE_COUNT } from "@/lib/workflow/stages";
import { initialsOf } from "@/components/layout/initials";
import { NAV } from "@/components/layout/nav";
import { NewRoleButton } from "@/components/roles/new-role-button";

export const metadata = { title: "Home · Recruiter AI Co-Pilot" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const HIGHLIGHTS = [
  {
    title: "Isolated role workspaces",
    body: "Every role keeps its own stages, CVs, sourcing profiles and tracker — nothing leaks between roles.",
  },
  {
    title: "AI scoring you can audit",
    body: "CVs are scored 0–100 against the JD and scorecard with a fit category, summary, strengths and gaps.",
  },
  {
    title: "Recruiter stays in control",
    body: "Decisions and notes are never overwritten by rescoring, and internal notes never reach candidate messages.",
  },
];

export default async function HomePage() {
  const user = await requirePageUser();
  const { roles, decisions, scoredCount } = await getHomeOverview();
  const firstName = user.name.split(/\s+/)[0] || user.name;

  const stats = [
    { label: "Active roles", value: roles.length },
    { label: "Candidates scored", value: scoredCount },
    { label: "Proceeding to interview", value: decisions["Proceed to interview"] ?? 0 },
    { label: "Pending decisions", value: decisions["Pending"] ?? 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome + account */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card relative overflow-hidden p-6 lg:col-span-2">
          <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{firstName}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Recruiter AI Co-Pilot takes each role from the kick-off meeting to the final decision in seven AI-assisted stages, with a
            shared candidate tracker along the way.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {roles.length ? (
              <Link href="/workflow" className="btn-primary">Continue workflow</Link>
            ) : (
              <NewRoleButton label="+ Create your first role" className="btn-primary" />
            )}
            <Link href="/tracker" className="btn-secondary">Open tracker</Link>
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
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Overview">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="font-display text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Roles */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Your roles</h2>
            <p className="text-sm text-muted">Most recently updated first.</p>
          </div>
          {roles.length > 0 && <NewRoleButton />}
        </div>
        {roles.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 truncate font-semibold">{role.name}</h3>
                  <span className="shrink-0 text-xs text-faint">{dateFormat.format(role.updatedAt)}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Stages completed</span>
                    <span>
                      {role.stagesDone}/{STAGE_COUNT}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(role.stagesDone / STAGE_COUNT) * 100}%` }} />
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span>{role.candidates} candidates</span>
                  <span>{role.profiles} sourcing profiles</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/workflow?role=${role.id}`} className="btn-secondary flex-1 py-1.5">Workflow</Link>
                  <Link href={`/tracker?role=${role.id}`} className="btn-ghost flex-1 py-1.5">Tracker</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            No roles yet. Each role is an isolated recruiting workspace — create one to start the workflow.
          </div>
        )}
      </section>

      {/* Workflow features */}
      <section>
        <h2 className="font-display text-lg font-semibold">The seven-stage workflow</h2>
        <p className="text-sm text-muted">Each stage builds on the previous one. Jump straight into any stage of your current role.</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.number}>
              <Link href={`/workflow?stage=${stage.number}`} className="card group flex h-full flex-col p-4 transition hover:border-primary/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-strong">
                    {stage.number}
                  </span>
                  <h3 className="font-semibold group-hover:text-primary-strong">{stage.title}</h3>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{stage.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {stage.produces.slice(0, 3).map((p) => (
                    <span key={p} className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.7rem] text-muted">{p}</span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tracker" className="card group flex h-full flex-col border-dashed p-4 transition hover:border-primary/60">
              <h3 className="font-semibold group-hover:text-primary-strong">Candidate Tracker</h3>
              <p className="mt-2 text-sm text-muted">{NAV.find((n) => n.href === "/tracker")?.description}. Changes save automatically.</p>
            </Link>
          </li>
        </ol>
      </section>

      {/* Highlights */}
      <section className="grid gap-3 md:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="rounded-xl border border-line bg-surface-2/50 p-4">
            <h3 className="text-sm font-semibold">{h.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{h.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
