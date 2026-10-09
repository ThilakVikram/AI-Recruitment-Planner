import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getRecruitmentWorkspace } from "@/lib/db/recruitments";
import { NOTES_STEP, SECTIONS, SECTION_KEYS, parseRecruitmentSlug, recruitmentCode, recruitmentSlug, type StepKey } from "@/lib/recruitment/constants";
import { hasKickoffNotes, toKickoffForm } from "@/lib/recruitment/kickoff";
import { toApplicationDTO, toProfileDTO, toSectionDTO } from "@/lib/recruitment/dto";
import { asSkillList, formatExperience, shortDate } from "@/lib/roles/format";
import { RecruitmentWorkspace } from "@/components/recruitment/workspace";
import { RecruitmentStatusBadge } from "@/components/recruitment/status-badge";
import { DeleteRecruitmentButton } from "@/components/recruitment/delete-recruitment-button";

/** Open ?section= if given; otherwise start at the notes until there are some, then at Job Management. */
function initialStep(section: string | string[] | undefined, notesReady: boolean): StepKey {
  if (!notesReady || section === NOTES_STEP.key) return NOTES_STEP.key;
  return SECTIONS.find((s) => s.key === section)?.key ?? SECTIONS[0].key;
}

export async function generateMetadata({ params }: PageProps<"/recruitment/[slug]">) {
  await requirePageUser();
  const id = parseRecruitmentSlug((await params).slug);
  return { title: `${id ? recruitmentCode(id) : "Recruitment"} · Recruiter AI Co-Pilot` };
}

export default async function RecruitmentPage({ params, searchParams }: PageProps<"/recruitment/[slug]">) {
  await requirePageUser();
  const { slug } = await params;
  const { section } = await searchParams;
  const id = parseRecruitmentSlug(slug);
  if (!id) notFound();
  // Canonical URL is the zero-padded number: /recruitment/1 → /recruitment/001
  if (slug !== recruitmentSlug(id)) {
    redirect(`/recruitment/${recruitmentSlug(id)}${typeof section === "string" ? `?section=${encodeURIComponent(section)}` : ""}`);
  }

  const r = await getRecruitmentWorkspace(id);
  if (!r) notFound();

  const { role } = r;
  const kickoff = { form: toKickoffForm(r.kickoffFields), raw: r.kickoffRaw ?? "" };
  const facts = (
    [
      ["Department", role.department],
      ["Location", [role.location, role.workMode].filter(Boolean).join(" · ") || null],
      ["Experience", formatExperience(role.experienceMin, role.experienceMax)],
      ["Salary", role.salaryRange],
      ["Hiring manager", role.hiringManager],
      ["Target date", role.targetDate ? shortDate.format(role.targetDate) : null],
    ] as [string, string | null][]
  ).filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <>

      <RecruitmentWorkspace
        header={
          <>
            <h1 className="min-w-0 truncate font-display text-base font-semibold">
              <span className="font-mono text-primary-strong">{recruitmentCode(r.id)}</span> · {role.name}
            </h1>
            <RecruitmentStatusBadge status={r.status} />
            <span className="hidden text-xs whitespace-nowrap text-faint xl:inline">
              Created {shortDate.format(r.createdAt)}
              {r.createdBy && ` by ${r.createdBy.name}`}
            </span>
          </>
        }
        deleteButton={<DeleteRecruitmentButton recruitmentId={r.id} code={recruitmentCode(r.id)} />}
        recruitment={{ id: r.id, summary: r.summary, status: r.status, openings: r.openings }}
        role={{ id: role.id, name: role.name, status: role.status, facts, requiredSkills: asSkillList(role.requiredSkills) }}
        kickoff={kickoff}
        sections={r.sections.filter((s) => (SECTION_KEYS as readonly string[]).includes(s.key)).map(toSectionDTO)}
        applications={r.applications.map(toApplicationDTO)}
        profiles={r.profiles.map(toProfileDTO)}
        initialSection={initialStep(section, hasKickoffNotes(kickoff.form, kickoff.raw))}
        roleDefaults={{
          experienceMin: role.experienceMin,
          experienceMax: role.experienceMax,
          location: role.location,
          workMode: role.workMode,
          salaryRange: role.salaryRange,
          hiringManager: role.hiringManager,
          requiredSkills: asSkillList(role.requiredSkills),
          niceToHaveSkills: asSkillList(role.niceToHaveSkills),
        }}
      />
    </>
  );
}
