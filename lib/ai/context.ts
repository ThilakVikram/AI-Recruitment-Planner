import "server-only";
import type { getRole } from "@/lib/db/roles";

export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n\n[…truncated…]`;
}

type RoleRecord = NonNullable<Awaited<ReturnType<typeof getRole>>>;

function skillNames(value: unknown): string {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string").join(", ") : "";
}

/**
 * The role's requisition details (from /roles) as a compact brief for prompts.
 * Only filled-in fields are listed, so the model can't mistake blanks for requirements.
 */
export function formatRoleBrief(role: RoleRecord): string {
  const experience =
    role.experienceMin !== null && role.experienceMax !== null
      ? `${role.experienceMin}–${role.experienceMax} years`
      : role.experienceMin !== null
        ? `${role.experienceMin}+ years`
        : role.experienceMax !== null
          ? `Up to ${role.experienceMax} years`
          : "";
  const facts: [string, string | null][] = [
    ["Department", role.department],
    ["Location", role.location],
    ["Work mode", role.workMode],
    ["Employment type", role.employmentType],
    ["Openings", String(role.openings)],
    ["Experience", experience],
    ["Salary range", role.salaryRange],
    ["Hiring manager", role.hiringManager],
    ["Target fill date", role.targetDate ? role.targetDate.toISOString().slice(0, 10) : null],
    ["Priority", role.priority],
    ["Required skills", skillNames(role.requiredSkills)],
    ["Nice-to-have skills", skillNames(role.niceToHaveSkills)],
    ["Summary", role.description ? clip(role.description, 3000) : null],
  ];
  const lines = facts.filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`);
  return `${role.name}\n\nRequisition details on file:\n${lines.join("\n")}`;
}
