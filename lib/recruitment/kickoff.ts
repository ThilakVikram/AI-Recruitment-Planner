/**
 * Kick-off meeting notes (recruitment step 1) as a structured form, one block per topic.
 * Safe for client and server. Stored in recruitment.kickoffFields (JSON).
 */
import { WORK_MODES } from "@/lib/roles/constants";

export const KICKOFF_TOPICS = [
  { key: "responsibilities", label: "Responsibilities" },
  { key: "skills", label: "Must-have & nice-to-have skills" },
  { key: "experience", label: "Experience, location & salary" },
  { key: "team", label: "Team & interview process" },
] as const;

export type KickoffForm = {
  responsibilities: { items: string[]; outcomes: string; notes: string };
  skills: { mustHave: string[]; niceToHave: string[]; notes: string };
  experience: { minYears: number | null; maxYears: number | null; location: string; workMode: string; salaryRange: string; noticePeriod: string; notes: string };
  team: { teamSize: string; reportsTo: string; interviewRounds: string[]; timeline: string; notes: string };
};

export const EMPTY_KICKOFF: KickoffForm = {
  responsibilities: { items: [], outcomes: "", notes: "" },
  skills: { mustHave: [], niceToHave: [], notes: "" },
  experience: { minYears: null, maxYears: null, location: "", workMode: "", salaryRange: "", noticePeriod: "", notes: "" },
  team: { teamSize: "", reportsTo: "", interviewRounds: [], timeline: "", notes: "" },
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Reads stored JSON safely. Older plain-text topics (one string per topic) land in that topic's “Other notes”. */
export function toKickoffForm(value: unknown): KickoffForm {
  const v = obj(value);
  const topic = (key: string) => (typeof v[key] === "string" ? { notes: v[key] as string } : obj(v[key]));
  const r = topic("responsibilities");
  const s = topic("skills");
  const e = topic("experience");
  const t = topic("team");
  return {
    responsibilities: { items: strs(r.items), outcomes: str(r.outcomes), notes: str(r.notes) },
    skills: { mustHave: strs(s.mustHave), niceToHave: strs(s.niceToHave), notes: str(s.notes) },
    experience: {
      minYears: num(e.minYears),
      maxYears: num(e.maxYears),
      location: str(e.location),
      workMode: (WORK_MODES as readonly string[]).includes(str(e.workMode)) ? str(e.workMode) : "",
      salaryRange: str(e.salaryRange),
      noticePeriod: str(e.noticePeriod),
      notes: str(e.notes),
    },
    team: { teamSize: str(t.teamSize), reportsTo: str(t.reportsTo), interviewRounds: strs(t.interviewRounds), timeline: str(t.timeline), notes: str(t.notes) },
  };
}

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.values(value).some(hasContent);
  return false;
}

/** Whether one topic has anything filled in (for the ✓ on each form block). */
export function topicFilled(form: KickoffForm, key: keyof KickoffForm): boolean {
  return hasContent(form[key]);
}

/** Enough kick-off notes to unlock the AI sections: anything in the form, or full notes. */
export function hasKickoffNotes(form: KickoffForm, raw: string): boolean {
  return hasContent(form) || raw.trim().length >= 20;
}

function years(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return min === max ? `${min} years` : `${min}–${max} years`;
  if (min !== null) return `${min}+ years`;
  if (max !== null) return `Up to ${max} years`;
  return "";
}

/** The notes as the AI sees them: the form by topic, then the full notes (the form wins where they differ). */
export function formatKickoffNotes(form: KickoffForm, raw: string): string {
  const line = (label: string, value: string) => (value.trim() ? `- ${label}: ${value.trim()}` : "");
  const list = (label: string, items: string[], numbered = false) =>
    items.length ? `${label}:\n${items.map((x, i) => `${numbered ? `${i + 1}.` : "  -"} ${x}`).join("\n")}` : "";
  const block = (title: string, parts: string[]) => {
    const body = parts.filter(Boolean).join("\n");
    return body ? `## ${title}\n${body}` : "";
  };
  const { responsibilities: r, skills: s, experience: e, team: t } = form;
  const [rT, sT, eT, tT] = KICKOFF_TOPICS.map((x) => x.label);

  const sections = [
    block(rT, [list("Key responsibilities", r.items), line("Key outcomes (first 6–12 months)", r.outcomes), line("Other notes", r.notes)]),
    block(sT, [line("Must-have", s.mustHave.join(", ")), line("Nice-to-have", s.niceToHave.join(", ")), line("Other notes", s.notes)]),
    block(eT, [
      line("Experience", years(e.minYears, e.maxYears)),
      line("Location", e.location),
      line("Work mode", e.workMode),
      line("Salary range", e.salaryRange),
      line("Notice period", e.noticePeriod),
      line("Other notes", e.notes),
    ]),
    block(tT, [line("Team size", t.teamSize), line("Reports to", t.reportsTo), list("Interview rounds", t.interviewRounds, true), line("Hiring timeline", t.timeline), line("Other notes", t.notes)]),
  ].filter(Boolean);

  if (raw.trim()) {
    sections.push(
      `## Full meeting notes${sections.length ? " (for extra detail — where they differ, the sections above are the recruiter's confirmed version)" : ""}\n${raw.trim()}`,
    );
  }
  return sections.join("\n\n");
}

/**
 * Fills only the empty parts of the form from the role's requisition details,
 * so the recruiter doesn't retype what's already on the role.
 */
export function prefillFromRole(form: KickoffForm, role: Partial<{
  experienceMin: number | null;
  experienceMax: number | null;
  location: string | null;
  workMode: string | null;
  salaryRange: string | null;
  hiringManager: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
}>): KickoffForm {
  const or = (current: string, next: string | null | undefined) => current || next || "";
  return {
    ...form,
    skills: {
      ...form.skills,
      mustHave: form.skills.mustHave.length ? form.skills.mustHave : (role.requiredSkills ?? []),
      niceToHave: form.skills.niceToHave.length ? form.skills.niceToHave : (role.niceToHaveSkills ?? []),
    },
    experience: {
      ...form.experience,
      minYears: form.experience.minYears ?? role.experienceMin ?? null,
      maxYears: form.experience.maxYears ?? role.experienceMax ?? null,
      location: or(form.experience.location, role.location),
      workMode: or(form.experience.workMode, role.workMode),
      salaryRange: or(form.experience.salaryRange, role.salaryRange),
    },
    team: { ...form.team, reportsTo: or(form.team.reportsTo, role.hiringManager) },
  };
}

/** Trims a form (e.g. from AI) to the limits the save API enforces, so it can always be re-saved. */
export function clampKickoffForm(form: KickoffForm): KickoffForm {
  const cut = (v: string, max: number) => v.trim().slice(0, max);
  const list = (items: string[], maxItems: number, maxLen: number) => items.map((x) => cut(x, maxLen)).filter(Boolean).slice(0, maxItems);
  const yrs = (v: number | null) => (v === null ? null : Math.max(0, Math.min(60, Math.round(v))));
  let [minYears, maxYears] = [yrs(form.experience.minYears), yrs(form.experience.maxYears)];
  if (minYears !== null && maxYears !== null && minYears > maxYears) [minYears, maxYears] = [maxYears, minYears];
  return {
    responsibilities: { items: list(form.responsibilities.items, 30, 500), outcomes: cut(form.responsibilities.outcomes, 5000), notes: cut(form.responsibilities.notes, 10_000) },
    skills: { mustHave: list(form.skills.mustHave, 50, 60), niceToHave: list(form.skills.niceToHave, 50, 60), notes: cut(form.skills.notes, 10_000) },
    experience: {
      minYears,
      maxYears,
      location: cut(form.experience.location, 200),
      workMode: form.experience.workMode,
      salaryRange: cut(form.experience.salaryRange, 100),
      noticePeriod: cut(form.experience.noticePeriod, 100),
      notes: cut(form.experience.notes, 10_000),
    },
    team: {
      teamSize: cut(form.team.teamSize, 100),
      reportsTo: cut(form.team.reportsTo, 200),
      interviewRounds: list(form.team.interviewRounds, 15, 300),
      timeline: cut(form.team.timeline, 500),
      notes: cut(form.team.notes, 10_000),
    },
  };
}
