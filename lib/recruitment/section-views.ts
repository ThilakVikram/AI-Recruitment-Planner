/**
 * Turns a recruitment section's stored output into tabs (safe for client and server).
 * The same tab definitions render the markdown kept in `output`, so copy/export and later
 * prompts see exactly what the tabs show.
 */
import type { KickoffOutput } from "@/lib/ai/schemas/kickoff";
import { getSection, type ApplicantOutputKind, type SectionKey } from "./constants";

export type OutputTab = { label: string; content: string };
export type OutputGroup = {
  /** Sub-heading (e.g. an applicant's name); null for none. */
  label: string | null;
  /** e.g. the screening recommendation. */
  badge?: { text: string; tone: "good" | "warn" | "bad" };
  notice?: string;
  /** Supporting info that isn't one of the section's products (shown collapsed above the tabs). */
  aside?: { title: string; content: string };
  tabs: OutputTab[];
};

/** Analysed LinkedIn / Naukri profiles, for the sourcing section's “Ranked profile shortlist”. */
export type ShortlistProfile = { candidateName: string; platform: string; score: number | null; verdict: string | null; reason?: string | null };

type Data = Record<string, unknown>;
/** How to build one tab's markdown from the structured fields. */
type Part = (d: Data, ctx: ViewContext) => string;
type ViewContext = { profiles?: ShortlistProfile[] };

const field = (key: string): Part => (d) => String(d[key] ?? "").trim();
/** Several fields in one tab, each under its own sub-heading. */
const merged = (...parts: [string, string][]): Part => (d) =>
  parts
    .map(([key, heading]) => {
      const v = String(d[key] ?? "").trim();
      return v ? `### ${heading}\n\n${v}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

function shortlistTable(profiles: ShortlistProfile[]): string {
  const ranked = profiles.filter((p) => p.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (!ranked.length) return "_No profiles analysed yet — paste LinkedIn / Naukri profiles using **Profile analysis** at the top of the page._";
  const cell = (v: string) => v.replace(/\|/g, "\\|").replace(/\s+/g, " ");
  return [
    "| # | Candidate | Platform | Fit | Verdict | Why |",
    "|---|---|---|---|---|---|",
    ...ranked.map((p, i) => `| ${i + 1} | ${cell(p.candidateName)} | ${p.platform} | ${p.score}/10 | ${p.verdict ?? "—"} | ${cell(p.reason ?? "")} |`),
  ].join("\n");
}

/**
 * One entry per item in the section's “This section produces” list (same order), so the
 * tabs always match what the section says it produces.
 */
const PARTS: Record<Exclude<SectionKey, "kickoff">, Part[]> = {
  "market-research": [
    field("sourcingPlan"),
    field("talentMarketMap"),
    field("targetCompanies"),
    field("targetCandidateProfiles"),
    field("marketObservations"),
    field("sourcingChannels"),
  ],
  sourcing: [
    merged(["sourcingStrategy", "Sourcing strategy"], ["channelStrategy", "Channel strategy"]),
    field("booleanStrings"),
    field("targetProfileCharacteristics"),
    (d, ctx) => {
      const guidance = String(d.outreachPrioritisation ?? "").trim();
      const table = ctx.profiles ? shortlistTable(ctx.profiles) : "";
      return [table, guidance && `### How to prioritise outreach\n\n${guidance}`].filter(Boolean).join("\n\n");
    },
  ],
};

function tabsFor(key: Exclude<SectionKey, "kickoff">, d: Data, ctx: ViewContext): OutputTab[] {
  const produces = getSection(key)!.produces;
  return PARTS[key]
    .map((part, i) => ({ label: produces[i], content: part(d, ctx) }))
    .filter((t) => t.label && t.content);
}

function kickoffGroup(k: KickoffOutput): OutputGroup {
  const [jd, scorecard, linkedin, naukri, other] = getSection("kickoff")!.produces;
  const tabs: OutputTab[] = [
    { label: jd, content: k.jobDescription },
    { label: scorecard, content: k.scorecard },
    { label: linkedin, content: k.linkedinPost },
    { label: naukri, content: k.naukriPost },
    { label: other, content: (k.otherPosts ?? []).map((p) => `### ${p.channel}\n\n${p.post}`).join("\n\n") },
  ].filter((t) => t.content.trim());
  const questions = k.openQuestions ?? [];
  return {
    label: null,
    tabs,
    aside: questions.length
      ? { title: `Open questions for the hiring manager (${questions.length})`, content: questions.map((q) => `- ${q}`).join("\n") }
      : undefined,
  };
}

/**
 * Fallback for output generated before sections were structured: split on "## " headings.
 * Per-applicant sections were stored as "## Name" blocks, so those become one tab per applicant.
 */
function tabsFromMarkdown(markdown: string): OutputTab[] {
  const parts = markdown.split(/^## +/m);
  const intro = parts.shift()?.trim();
  const tabs = parts
    .map((part) => {
      const newline = part.indexOf("\n");
      const label = (newline === -1 ? part : part.slice(0, newline)).trim();
      const content = (newline === -1 ? "" : part.slice(newline + 1)).replace(/\n---\s*$/, "").trim();
      return { label: label.replace(/^\d+\.\s*/, ""), content };
    })
    .filter((t) => t.label && t.content);
  if (tabs.length < 2) return [{ label: "Output", content: markdown }];
  if (intro) tabs.unshift({ label: "Note", content: intro });
  return tabs;
}

export function sectionGroups(key: SectionKey, data: unknown, output: string, ctx: ViewContext = {}): OutputGroup[] {
  if (!output.trim()) return [];
  const obj = data && typeof data === "object" ? (data as Data) : null;

  if (key === "kickoff") {
    if (obj?.jobDescription) return [kickoffGroup(obj as unknown as KickoffOutput)];
  } else if (obj && (key === "market-research" || key === "sourcing")) {
    return [{ label: null, notice: typeof obj.disclaimer === "string" ? obj.disclaimer : undefined, tabs: tabsFor(key, obj, ctx) }];
  }

  return [{ label: null, tabs: tabsFromMarkdown(output) }];
}

/** Markdown rendering of structured output — what's stored in `output`. */
export function groupsToMarkdown(groups: OutputGroup[]): string {
  return groups
    .map((g) => {
      const head = [g.label ? `## ${g.label}` : null, g.badge ? `**Recommendation: ${g.badge.text}**` : null, g.notice ? `_${g.notice}_` : null]
        .filter(Boolean)
        .join("\n\n");
      const body = g.tabs.map((t) => `${g.label ? "###" : "##"} ${t.label}\n\n${t.content}`).join("\n\n");
      const aside = g.aside ? `## ${g.aside.title}\n\n${g.aside.content}` : "";
      return [head, body, aside].filter(Boolean).join("\n\n");
    })
    .join("\n\n---\n\n");
}

// ── Per-applicant outputs (applicant panel): outreach, screening, final decision ──

const RECOMMENDATION_TONE = { Proceed: "good", Hold: "warn", Reject: "bad" } as const;

const APPLICANT_TABS: Record<ApplicantOutputKind, [string, Part][]> = {
  outreach: [
    ["LinkedIn InMail", field("linkedinInMail")],
    ["Email", field("email")],
    ["WhatsApp / short follow-up", field("whatsapp")],
  ],
  screening: [
    ["Candidate overview", field("candidateOverview")],
    ["Relevant experience", field("relevantExperience")],
    ["Strengths & concerns", merged(["strengths", "Strengths"], ["concerns", "Concerns"])],
    ["Scorecard alignment", field("scorecardAlignment")],
    ["Interview observations", field("interviewObservations")],
    ["Recommendation", (d) => [d.recommendation ? `**${String(d.recommendation)}**` : "", String(d.recommendationRationale ?? "").trim()].filter(Boolean).join("\n\n")],
    ["Follow-up questions", field("followUpQuestions")],
  ],
  "final-decision": [
    ["Rejection email", field("rejectionEmail")],
    ["Constructive feedback", field("constructiveFeedback")],
  ],
};

/** One applicant's stored output as a tabbed group (null when none has been generated). */
export function applicantOutputGroup(kind: ApplicantOutputKind, stored: unknown): OutputGroup | null {
  if (!stored || typeof stored !== "object") return null;
  const d = stored as Data;
  const rec = kind === "screening" && typeof d.recommendation === "string" ? d.recommendation : null;
  return {
    label: null,
    badge: rec ? { text: rec, tone: RECOMMENDATION_TONE[rec as keyof typeof RECOMMENDATION_TONE] ?? "warn" } : undefined,
    tabs: APPLICANT_TABS[kind].map(([label, part]) => ({ label, content: part(d, {}) })).filter((t) => t.content),
  };
}
